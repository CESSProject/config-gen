const fs = require('fs-extra')
const shell = require('shelljs')
const yaml = require('js-yaml')
const toml = require('@iarna/toml')
const request = require('sync-request');

const chainHostName = "cess-chain"

const apiUrls = [
  "https://api.seeip.org",
  "https://api.ipify.org?format=json",
  "https://api.my-ip.io/ip",
  "https://ip.zxinc.org/getip",
  "https://ip.3322.net/",
  "https://api.ipify.org?format=text",
  "https://api.ip.sb/ip"
];

function getPublicEndpoint(port) {
  for (const url of apiUrls) {
    try {
      const res = request('GET', url);
      if (res.statusCode !== 200) continue;
      const contentType = res.headers['content-type'];
      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(res.getBody('utf8'));
        const ip = data.ip || data;
        return `${ip}:${port}`;
      } else {
        const ip = res.getBody('utf8').trim();
        return `${ip}:${port}`;
      }
    } catch (error) {
    }
  }
  return `127.0.0.1:${port}`;
}

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
  await fs.outputFile(path, yaml.safeDump(cfg, {ident: 2, lineWidth: -1}))
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
  getPublicEndpoint,
}
