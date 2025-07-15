# Getting Started

This section will help you set up and start using `starter-lib-ts`.

## Using Package Manager

::: code-group

```sh [npm]
npm install starter-lib-ts
```

```sh [yarn]
yarn add starter-lib-ts
```

```sh [pnpm]
pnpm install starter-lib-ts
```
:::

## Browser Direct Import

```js
<script src="https://unpkg.com/starter-lib-ts"></script>
```

It will be exposed as `window.StarterLibTs` in the global object.

## Usage Example

Simply import the required functions from `starter-lib-ts`.

```js
import { sayHello } from 'starter-lib-ts'

sayHello('Kieran')
```

For more information, please refer to the [functions List](/functions/index).
