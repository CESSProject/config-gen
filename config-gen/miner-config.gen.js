const { imageTagByProfile, getPublicEndpoint} = require('../utils')
const minerHomePath = "/opt/cess/storage/miner"

function ensureChainWsUrls(minerConfig, nodeConfig) {
  const chainWsUrl = minerConfig.chainWsUrl;
  const backupChainWsUrls = minerConfig.backupChainWsUrls || [];
  let urls;
  if (!chainWsUrl) {
    urls = backupChainWsUrls;
  } else {
    urls = [chainWsUrl, ...backupChainWsUrls];
  }
  if (!urls) {
    throw new Error("The chain ws-url must be set to at least one");
  }
  return urls;
}

async function genMinerConfig(config) {
  return {
    config: adapterToNativeConfig(config.miner, config.node),
    paths: [{
      required: true,
      path: minerHomePath
    }]
  }
}

function adapterToNativeConfig(minerConfig, nodeConfig) {
  return {
    app: {
      workspace: "/opt/miner-disk",
      port: minerConfig.port,
      maxusespace: minerConfig.space || minerConfig.UseSpace || 300,
      cores: minerConfig.useCpuCores || minerConfig.UseCpu || 0,
      apiendpoint: minerConfig.apiendpoint ? minerConfig.apiendpoint : getPublicEndpoint(minerConfig.port),
    },
    chain: {
      mnemonic: minerConfig.signPhrase || minerConfig.mnemonic,
      stakingacc: minerConfig.stakerAccount || minerConfig.stakingAcc || null,
      earningsacc: minerConfig.incomeAccount || minerConfig.earningsAcc,
      rpcs: ensureChainWsUrls(minerConfig, nodeConfig),
      tees: minerConfig.reservedTws || minerConfig.TeeList || [],
      timeout: minerConfig.timeout || 12,
    },
  }
}

async function genMinerComposeConfig(config) {
  return doComposeConfigGenerate(config.miner, config.node, minerHomePath, config.miner.diskPath)
}

function doComposeConfigGenerate(minerConfig, nodeConfig, binDir, dataDir) {
  let args = [
    "run",
    "-c",
    "/opt/miner/config.yaml",
  ]
  if (minerConfig.extraCmdArgs) {
    const extraCmdArgs = minerConfig.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }
  return {
    image: 'cesslab/cess-miner:' + imageTagByProfile(nodeConfig.profile),
    network_mode: 'host',
    restart: 'always',
    volumes: [
      binDir + ':/opt/miner',
      dataDir + ':/opt/miner-disk',
    ],
    command: args,
    logging: {
      driver: "json-file",
      options: {
        "max-size": "500m"
      }
    },
    healthcheck: {
      test: ["CMD", "nc", "-zv", "127.0.0.1", minerConfig.port.toString()],
      interval: "1m",
      timeout: "10s",
      retries: 3
    },
  }
}

module.exports = {
  genMinerConfig,
  genMinerComposeConfig,
  adapterToNativeConfig,
  doComposeConfigGenerate,
}
