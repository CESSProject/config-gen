/**
 * config generators
 */
const path = require('path')
const { writeConfig, } = require('../utils')
const { genChainConfig, genChainComposeConfig } = require('./chain-config.gen')
const { genSchedulerConfig, genSchedulerComposeConfig } = require('./scheduler-config.gen')
const { genBucketConfig, genBucketComposeConfig } = require('./bucket-config.gen')
const { genKaleidoConfig, genKaleidoComposeConfig } = require('./kaleido-config.gen')
const { genWatchtowerComposeConfig } = require('./watchtower-config.gen')
const { logger } = require('../logger')

/**
 * configuration of generators to use
 * name: the generator name
 *
 * async configFun(config, outputOptions) => {file, paths}
 * file: the result filename
 * paths: an array of files/directories should be verified later
 *    required: boolean whether this file is a mandontary requirement
 *    path: the file path
 *
 * composeName: the compose service name of this generator
 * async composeFunc(config) => composeConfig
 * return the service definition for this generator
 */
const configGenerators = [{
  name: 'chain',
  configFunc: genChainConfig,
  to: path.join('chain', 'config.json'),
  composeName: 'chain',
  composeFunc: genChainComposeConfig,
}, {
  name: 'scheduler',
  configFunc: genSchedulerConfig,
  to: path.join('scheduler', 'config.toml'),
  composeName: 'scheduler',
  composeFunc: genSchedulerComposeConfig,
}, {
  name: 'bucket',
  configFunc: genBucketConfig,
  to: path.join('bucket', 'config.toml'),
  composeName: 'bucket',
  composeFunc: genBucketComposeConfig,
}, {
  name: 'kaleido',
  configFunc: genKaleidoConfig,
  to: path.join('kaleido', 'config.toml'),
  composeName: 'kaleido',
  composeFunc: genKaleidoComposeConfig,
}, {
  name: 'watchtower',
  composeName: 'watchtower',
  composeFunc: genWatchtowerComposeConfig,
}]

async function genConfig(config, outputOpts) {
  // application config generation
  let outputs = []
  const { baseDir } = outputOpts
  for (const cg of configGenerators) {
    if (!config[cg.name] || !cg.configFunc) {
      continue
    }
    const ret = await cg.configFunc(config, outputOpts)
    await writeConfig(path.join(baseDir, cg.to), ret.config)
    outputs.push({
      generator: cg.name,
      ...ret,
    })
  }

  logger.info('Generating configurations done')
  return outputs
}

async function genComposeConfig(config) {
  // docker compose config generation
  let output = {
    version: '3.0',
    services: {},
  }

  for (const cg of configGenerators) {
    if (!(config[cg.name] || cg.name === "watchtower")) {
      continue
    }
    const cfg = await cg.composeFunc(config)
    cfg["container_name"] = cg.composeName
    output = {
      ...output,
      services: {
        ...output.services,
        [cg.composeName]: cfg,
      }
    }
  }

  logger.info('Generating docker compose file done')

  return output
}

module.exports = {
  genConfig,
  genComposeConfig,
}
