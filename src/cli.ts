import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { version } from '../package.json'
import { init } from './init'
import { gen } from './gen'
import { resolveConfig } from './config'

// eslint-disable-next-line no-unused-expressions
yargs(hideBin(process.argv))
  .scriptName('gen-api')
  .usage('$0 [args]')
  .command('init', 'init api.config.ts', (args) => {
    return args
      .option('force', {
        alias: 'f',
        type: 'boolean',
        default: false,
        describe: '是否覆盖本地的 api.config.ts 文件',
      })
      .help()
  }, async args => init(args))
  .command('now', 'generate api code', args => args, async () => gen(await resolveConfig()))
  .alias('h', 'help')
  .version('version', version)
  .alias('v', 'version')
  .help()
  .argv
