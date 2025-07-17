import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, '../src/grammar/schedule-grammar.ohm-bundle.js')

try {
    let content = fs.readFileSync(filePath, 'utf8')

    content = content.replace(
        /const \{makeRecipe\}=require\('ohm-js'\)/g,
        'import { makeRecipe } from \'ohm-js\'',
    )

    content = content.replace(
        /module\.exports=result/g,
        'export default result',
    )

    fs.writeFileSync(filePath, content, 'utf8')
    console.log('Grammar bundle converted to ES modules')
} catch (error) {
    console.error('Error converting grammar bundle:', error.message)
}
