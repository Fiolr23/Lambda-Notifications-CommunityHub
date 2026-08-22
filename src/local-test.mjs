// Permite probar el handler en tu maquina antes de subirlo a AWS.
// Uso: node --env-file=.env src/local-test.mjs
import { handler } from './index.mjs'

const result = await handler({})
console.log(result)
process.exit(0)
