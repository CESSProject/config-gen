
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const yaml = require('js-yaml')
const { genConfig, genComposeConfig } = require('./config-gen')
const { getConfigSchema } = require('./schema')
const { logger } = require('./logger')
const { writeYaml } = require('./utils')

async function loadConfig(file) {
  logger.debug('Loading config file: %s', file)
  const config = yaml.safeLoad(await fs.readFile(file, 'utf8'))
  const configSchema = getConfigSchema(config)
  const value = await configSchema.validateAsync(config, {
    allowUnknown: true,
    stripUnknown: true,
  })

  const data = await genConfig(value, {
    baseDir: '.tmp',
  })
  const composeConfig = await genComposeConfig(value)
  await writeYaml(path.join('.tmp','docker-compose.yaml'), composeConfig)
  await dumpConfigPaths(path.join('.tmp', '.paths'), data)
}

async function dumpConfigPaths(toFile, data) {
  const paths = _(data).map(d => _.get(d, 'paths', [])).flatten().map(p => {
    let mark = '|'
    if (p.required) {
      mark = '+'
    }
    return `${mark} ${p.path}`
  }).uniq()

  await fs.outputFile(toFile, paths.join('\n'))
}

async function main(){
  try {
    const args = process.argv.slice(2);
    let configFile = "config.yaml";
    if (args.length >= 1) {
      if (args[0].toLowerCase() == "version") {
        const {name, version} = require('./package.json');
        console.log(name, version);
        return;
      }
      else {
        configFile = args[0];
      }
    }

    await loadConfig(configFile);
  } catch(e) {
    logger.error('failed to load config: %o', e.message);
    console.trace(e);
    process.exit(1)
  }
}

main()
