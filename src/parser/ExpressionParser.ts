// src/schedule/parser/ExpressionParser.ts

// Import the typescript-friendly grammar definition
import grammar, { ScheduleGrammarActionDict } from '../grammar/schedule-grammar.ohm-bundle';

import AndOperator from '../schedule/blocks/conditions/AndBlock';
import OrBlock from '../schedule/blocks/conditions/OrBlock';
import NotBlock from '../schedule/blocks/conditions/NotBlock';
import TimeField from '../schedule/blocks/fields/TimeField';
import WeekDayField from '../schedule/blocks/fields/WeekDayField';
import DateField from '../schedule/blocks/fields/DateField';
import MonthField from '../schedule/blocks/fields/MonthField';
import MonthDayField from '../schedule/blocks/fields/MonthDayField';
import YearField from '../schedule/blocks/fields/YearField';
import DateTimeField from '../schedule/blocks/fields/DateTimeFields';

import { DateTimeRange, IBlock, MergeState, ParsedNumericValue } from '../types';
import { NonterminalNode } from 'ohm-js';
import Reference from '../schedule/blocks/fields/Reference';

// Import types using type-only import
// import type { ScheduleGrammarActionDict } from '../grammar/schedule-grammar.ohm-bundle';
// import * as grammarModule from '../grammar/schedule-grammar.ohm-bundle';

//const grammar = grammarModule.default || grammarModule;

interface ScheduleReference {
  type: 'ScheduleReference';
  referenceId: string;
}

interface ParenthesizedBlock {
  type: 'ParenthesizedBlock';
  block: IBlock;
}

class ExpressionParser {
  private semantics: ReturnType<typeof grammar.createSemantics>;
  private parserState = {
    inParentheses: false,
  };

  constructor() {
    if (!grammar) {
      throw new Error('Grammar not available - cannot create ExpressionParser instance');
    }
    this.semantics = grammar.createSemantics();
    this.initializeSemantics();
  }

  /**
   * Parse a schedule expression string into a block object
   */
  parse(expression: string): IBlock {
    try {
      this.parserState.inParentheses = false;

      const matchResult = grammar.match(expression);
      if (matchResult.succeeded()) {
        const result = this.semantics(matchResult).eval();

        let unwrappedResult = result;
        while (
          unwrappedResult &&
          typeof unwrappedResult === 'object' &&
          'type' in unwrappedResult &&
          unwrappedResult.type === 'ParenthesizedBlock'
          ) {
          unwrappedResult = (unwrappedResult as ParenthesizedBlock).block;
        }

        return unwrappedResult as IBlock;
      } else {
        throw new Error(`Failed to parse expression: ${expression}`);
      }
    } catch (error) {
      throw new Error(
        `Error parsing expression: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private handleAndExpression(left: NonterminalNode, right: NonterminalNode): IBlock {
    let leftEval = left.eval();
    let rightEval = right.eval();

    const leftIsParenthesized =
      leftEval &&
      typeof leftEval === 'object' &&
      'type' in leftEval &&
      leftEval.type === 'ParenthesizedBlock';
    const rightIsParenthesized =
      rightEval &&
      typeof rightEval === 'object' &&
      'type' in rightEval &&
      rightEval.type === 'ParenthesizedBlock';

    if (leftIsParenthesized) leftEval = (leftEval as ParenthesizedBlock).block;
    if (rightIsParenthesized) rightEval = (rightEval as ParenthesizedBlock).block;

    const andBlock = new AndOperator();

    if (leftIsParenthesized || !(leftEval instanceof AndOperator)) {
      andBlock.addBlock(leftEval as IBlock);
    } else {
      (leftEval as AndOperator).getBlocks().forEach((block) => andBlock.addBlock(block));
    }

    if (rightIsParenthesized || !(rightEval instanceof AndOperator)) {
      andBlock.addBlock(rightEval as IBlock);
    } else {
      (rightEval as AndOperator).getBlocks().forEach((block) => andBlock.addBlock(block));
    }

    return andBlock;
  }

  private handleOrExpression(left: NonterminalNode, right: NonterminalNode): IBlock {
    let leftEval = left.eval();
    let rightEval = right.eval();

    const leftIsParenthesized =
      leftEval &&
      typeof leftEval === 'object' &&
      'type' in leftEval &&
      leftEval.type === 'ParenthesizedBlock';
    const rightIsParenthesized =
      rightEval &&
      typeof rightEval === 'object' &&
      'type' in rightEval &&
      rightEval.type === 'ParenthesizedBlock';

    if (leftIsParenthesized) leftEval = (leftEval as ParenthesizedBlock).block;
    if (rightIsParenthesized) rightEval = (rightEval as ParenthesizedBlock).block;

    const orBlock = new OrBlock();

    if (leftIsParenthesized || !(leftEval instanceof OrBlock)) {
      orBlock.addBlock(leftEval as IBlock);
    } else {
      (leftEval as OrBlock).getBlocks().forEach((block) => orBlock.addBlock(block));
    }

    if (rightIsParenthesized || !(rightEval instanceof OrBlock)) {
      orBlock.addBlock(rightEval as IBlock);
    } else {
      (rightEval as OrBlock).getBlocks().forEach((block) => orBlock.addBlock(block));
    }

    return orBlock;
  }

  private handleNotExpression(expr: NonterminalNode) {
    let exprEval = expr.eval();

    if (
      exprEval &&
      typeof exprEval === 'object' &&
      'type' in exprEval &&
      exprEval.type === 'ParenthesizedBlock'
    ) {
      exprEval = (exprEval as ParenthesizedBlock).block;
    }

    const notBlock = new NotBlock();
    notBlock.setBlock(exprEval as IBlock);

    return notBlock;
  }

  /**
   * Initialize the semantics for the grammar
   */
  private initializeSemantics() {
    const self = this;

    const actionDict: ScheduleGrammarActionDict<
      | IBlock
      | DateTimeRange
      | ParsedNumericValue
      | ScheduleReference
      | ParenthesizedBlock
      | number
      | string
      | any[]
    > = {
      _terminal() {
        return this.sourceString;
      },

      Expression(expr) {
        return expr.eval();
      },

      ConditionExpression(expr) {
        return expr.eval();
      },

      OrExpression_or(left, _, right) {
        return self.handleOrExpression(left, right);
      },

      OrExpression_commaOr(left, _, right) {
        return self.handleOrExpression(left, right);
      },

      OrExpression(expr) {
        return expr.eval();
      },

      AndExpression_and(left, _, right) {
        return self.handleAndExpression(left, right);
      },

      AndExpression_dotAnd(left, _, right) {
        return self.handleAndExpression(left, right);
      },

      AndExpression(expr) {
        return expr.eval();
      },

      NotExpression_not(_, expr) {
        return self.handleNotExpression(expr);
      },

      NotExpression_bangNot(_, expr) {
        return self.handleNotExpression(expr);
      },

      NotExpression(expr) {
        return expr.eval();
      },

      OptimizationExpression_noMerge(_, expr) {
        const result = expr.eval();

        if (
          result &&
          typeof result === 'object' &&
          'type' in result &&
          result.type === 'ParenthesizedBlock'
        ) {
          let currentBlock = result as ParenthesizedBlock;

          while (
            currentBlock.block &&
            typeof currentBlock.block === 'object' &&
            'type' in currentBlock.block &&
            (currentBlock.block as any).type === 'ParenthesizedBlock'
            ) {
            currentBlock = currentBlock.block as unknown as ParenthesizedBlock;
          }

          if (currentBlock.block && 'setMerge' in currentBlock.block) {
            (currentBlock.block as any).setMerge(MergeState.EXPLICIT_OFF);
          }
          return result;
        }

        if (result && typeof result === 'object' && 'setMerge' in result) {
          (result as any).setMerge(MergeState.EXPLICIT_OFF);
        }
        return result;
      },

      OptimizationExpression_forceMerge(_, expr) {
        const result = expr.eval();

        if (
          result &&
          typeof result === 'object' &&
          'type' in result &&
          result.type === 'ParenthesizedBlock'
        ) {
          let currentBlock = result as ParenthesizedBlock;

          while (
            currentBlock.block &&
            typeof currentBlock.block === 'object' &&
            'type' in currentBlock.block &&
            (currentBlock.block as any).type === 'ParenthesizedBlock'
            ) {
            currentBlock = currentBlock.block as unknown as ParenthesizedBlock;
          }

          if (currentBlock.block && 'setMerge' in currentBlock.block) {
            (currentBlock.block as any).setMerge(MergeState.EXPLICIT_ON);
          }
          return result;
        }

        if (result && typeof result === 'object' && 'setMerge' in result) {
          (result as any).setMerge(MergeState.EXPLICIT_ON);
        }
        return result;
      },

      OptimizationExpression_noMergeNot(_, notOp) {
        const result = notOp.eval();

        if (result && typeof result === 'object' && 'setMerge' in result) {
          (result as any).setMerge(MergeState.EXPLICIT_OFF);
        }
        return result;
      },

      OptimizationExpression_forceMergeNot(_, notOp) {
        const result = notOp.eval();

        if (result && typeof result === 'object' && 'setMerge' in result) {
          (result as any).setMerge(MergeState.EXPLICIT_ON);
        }
        return result;
      },

      OptimizationExpression(expr) {
        return expr.eval();
      },

      NotOperation_not(_, expr) {
        return self.handleNotExpression(expr);
      },

      NotOperation_bangNot(_, expr) {
        return self.handleNotExpression(expr);
      },

      NotOperation(expr) {
        return expr.eval();
      },

      PrimaryExpression_paren(expr) {
        return expr.eval();
      },

      PrimaryExpression_value(value) {
        return value.eval();
      },

      PrimaryExpression(expr) {
        return expr.eval();
      },

      ParenthesisExpression(_, expr, __) {
        const oldParenState = self.parserState.inParentheses;
        self.parserState.inParentheses = true;

        const result = expr.eval();

        self.parserState.inParentheses = oldParenState;

        return {
          type: 'ParenthesizedBlock',
          block: result,
        } as ParenthesizedBlock;
      },

      ValueBlock(block) {
        return block.eval();
      },

      TimeBlock(_, _open, timeRanges, _close) {
        const timeField = new TimeField();
        const ranges = timeRanges.eval();

        timeField.addValues(ranges);

        return timeField;
      },

      TimeRange(start, _, end) {
        return {
          start: start.eval(),
          end: end.eval(),
        };
      },

      Time(time) {
        return time.eval();
      },

      HourTime(h1, h2) {
        const hours = parseInt(h1.sourceString + h2.sourceString, 10);
        return hours * 3600000;
      },

      SecondTime(h1, h2, _, m1, m2) {
        const hours = parseInt(h1.sourceString + h2.sourceString, 10);
        const minutes = parseInt(m1.sourceString + m2.sourceString, 10);
        return hours * 3600000 + minutes * 60000;
      },

      MillisecondTime(h1, h2, _, m1, m2, __, s1, s2, s3) {
        const hours = parseInt(h1.sourceString + h2.sourceString, 10);
        const minutes = parseInt(m1.sourceString + m2.sourceString, 10);
        const seconds = parseInt(s1.sourceString + s2.sourceString + s3.sourceString, 10);
        return hours * 3600000 + minutes * 60000 + seconds;
      },

      WeekDayBlock(_, _open, values, _close) {
        const weekdayField = new WeekDayField();
        const valuesList = values.eval();

        weekdayField.addValues(valuesList);

        return weekdayField;
      },

      DateBlock(_, _open, dateList, _close) {
        const dateField = new DateField();
        const dateRanges = dateList.eval();

        dateField.addValues(dateRanges);

        return dateField;
      },

      MonthBlock(_, _open, values, _close) {
        const monthField = new MonthField();
        const valuesList = values.eval();

        monthField.addValues(valuesList);

        return monthField;
      },

      MonthDayBlock(_, _open, values, _close) {
        const monthDayField = new MonthDayField();
        const valuesList = values.eval();

        monthDayField.addValues(valuesList);

        return monthDayField;
      },

      YearBlock(_, _open, values, _close) {
        const yearField = new YearField();
        const valuesList = values.eval();

        yearField.addValues(valuesList);

        return yearField;
      },

      DateTimeBlock(_, _open, dateTimeList, _close) {
        const dateTimeField = new DateTimeField();
        const dateTimeRanges = dateTimeList.eval();

        dateTimeField.addValues(dateTimeRanges);

        return dateTimeField;
      },

      DateTimeList(list) {
        return list.eval();
      },

      DateTimeRange(start, _, end) {
        return {
          start: start.eval(),
          end: end.eval(),
        };
      },

      DateTime(date, _, time) {
        const datePart = date.eval();
        const timePart = time.eval();
        return datePart + timePart;
      },

      date(y1, y2, y3, y4, _, m1, m2, __, d1, d2) {
        const year = parseInt(
          y1.sourceString + y2.sourceString + y3.sourceString + y4.sourceString,
          10,
        );
        const month = parseInt(m1.sourceString + m2.sourceString, 10) - 1;
        const day = parseInt(d1.sourceString + d2.sourceString, 10);

        return Date.UTC(year, month, day);
      },

      ScheduleBlock(_, _open, refId, _close) {
        const referenceId = refId.eval();
        const reference = new Reference(referenceId);

        return reference;
      },

      ReferenceId(chars) {
        return chars.sourceString;
      },

      ValueList(list) {
        return list.eval();
      },

      ValueExpr_range(start, _, end) {
        return {
          type: 'Range',
          start: parseInt(start.sourceString, 10),
          end: parseInt(end.sourceString, 10),
        };
      },

      ValueExpr_algebraic(n, _, op, m) {
        const operatorStr = op.sourceString as '+' | '-';

        return {
          type: 'Algebraic',
          coefficientN: parseInt(n.sourceString, 10),
          operator: operatorStr,
          constantY: parseInt(m.sourceString, 10),
        };
      },

      ValueExpr_number(digits) {
        return {
          type: 'Number',
          value: parseInt(digits.sourceString, 10),
        };
      },

      ValueExpr(expr) {
        return expr.eval();
      },

      DateList(list) {
        return list.eval();
      },

      DateExpr_range(start, _, end) {
        const startDate = start.eval();
        const endDate = end.eval();

        const endOfDay = endDate + 86399999;

        return {
          start: startDate,
          end: endOfDay,
        };
      },

      DateExpr_single(date) {
        const dateTimestamp = date.eval();
        return {
          start: dateTimestamp,
          end: dateTimestamp + 86399999,
        };
      },

      DateExpr(expr) {
        return expr.eval();
      },

      nonemptyListOf(first, _sep, rest) {
        const firstVal = first.eval();
        const restVals = rest.eval();
        return [firstVal].concat(restVals);
      },

      _iter(...children) {
        return children.map((child) => child.eval());
      },
    };

    this.semantics.addOperation('eval', actionDict);
  }
}

export const expressionParser = new ExpressionParser();

export function parseExpression(expression: string): IBlock {
  if (!grammar) {
    throw new Error(
      'PTW grammar not available - make sure ohm-js is installed and grammar is properly built',
    );
  }
  return expressionParser.parse(expression);
}

export default ExpressionParser;
