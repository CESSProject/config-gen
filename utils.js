const fs = require('fs-extra')
const shell = require('shelljs')
const yaml = require('js-yaml')
const toml = require('@iarna/toml')

const chainHostName = "cess-chain"

async function createDir(dir) {
  if(shell.mkdir('-p', dir).code !== 0) {
    throw `failed to create directory: ${dir}`
  }
}

async function writeConfig(path, cfg) {
  if(path.endsWith(".yaml")) {
    return writeYaml(path, cfg);
  }
  else if(path.endsWith(".toml")) {
    return writeToml(path, cfg);
  }
  return writeJson(path, cfg);
}

async function writeJson(path, cfg) {
  await fs.outputJson(path, cfg, {
    spaces: 2,
  })
  return true
}

async function writeYaml(path, cfg) {
  await fs.outputFile(path, yaml.safeDump(cfg, {
    ident: 2,
  }))
  return true
}

async function writeToml(path, cfg) {
  await fs.outputFile(path, toml.stringify(cfg))
  return true
}

function imageTagByProfile(profile) {
  return profile
}


module.exports = {
  createDir,
  writeConfig,
  writeJson,
  writeYaml,
  writeToml,
  imageTagByProfile,
  chainHostName,
}
