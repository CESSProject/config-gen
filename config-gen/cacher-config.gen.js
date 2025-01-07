const {imageTagByProfile} = require("../utils");
const mineradmConfigPath = "/opt/cess/mineradm/config.yaml"
const cacherHomePath = "/opt/cess/config/multiminer/cacher"

function ensureRpcs(config) {
  const chainWsUrl = config.cacher.Rpcs || config.node.chainWsUrl;
  const backupChainWsUrls = config.node.backupChainWsUrls;
  return backupChainWsUrls ? [...chainWsUrl, ...backupChainWsUrls] : [...chainWsUrl];
}

async function genCacherConfig(config) {
  if (!config.cacher.Enable) {
    return null
  } else {
    const cacherConfig = {
      WorkSpace: config.cacher.WorkSpace,
      CacheSize: config.cacher.CacheSize,
      Rpcs: ensureRpcs(config),
      SecretKey: config.cacher.SecretKey,
      Token: config.cacher.Token,
      TokenAcc: config.cacher.TokenAcc,
      TokenAccSign: config.cacher.TokenAccSign,
      ProtoContract: config.cacher.ProtoContract,
      MinerConfigPath: config.cacher.MinerConfigPath,
      CdnNodes: config.cacher.CdnNodes,
      StorageNodes: config.cacher.StorageNodes,
    }
    return {
      config: cacherConfig,
      paths: [{
        required: true,
        path: cacherHomePath
      }]
    }
  }
}

async function genCacherComposeConfig(config) {
  if (!config.cacher.Enable) {
    return
  }
  return {
    container_name: 'cacher',
    image: 'cesslab/cacher:' + imageTagByProfile(config.node.profile),
    network_mode: 'host',
    restart: 'always',
    command:  [
      "-c",
      "/opt/cess/config.yaml",
      "run"
    ],
    volumes: [
      config.cacher.WorkSpace + ':/opt/cess',
      mineradmConfigPath + `:${config.cacher.MinerConfigPath}`,
    ],
    logging: {
      driver: "json-file",
      options: {
        "max-size": "100m",
        "max-file": '7'
      }
    },
  }
}

module.exports = {
  genCacherConfig,
  genCacherComposeConfig
}
