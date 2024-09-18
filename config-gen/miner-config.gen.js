const { imageTagByProfile } = require('../utils')
const minerHomePath = "/opt/cess/storage/miner"

function ensureChainWsUrls(minerConfig, nodeConfig) {
  // TODO: For compatibility, keep the deprecated node.chainWsUrl and node.backupChainWsUrls
  const chainWsUrl = minerConfig.chainWsUrl || nodeConfig.chainWsUrl;
  const backupChainWsUrls = minerConfig.backupChainWsUrls || nodeConfig.backupChainWsUrls || [];
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
    Rpc: ensureChainWsUrls(minerConfig, nodeConfig),
    Port: minerConfig.port,
    Boot: [minerConfig.bootAddr || process.env["MINER_BOOT"] || `_dnsaddr.boot-miner-${imageTagByProfile(nodeConfig.profile)}.cess.cloud`],
    Mnemonic: minerConfig.signPhrase || minerConfig.mnemonic,
    EarningsAcc: minerConfig.incomeAccount || minerConfig.earningsAcc,
    UseSpace: minerConfig.space || minerConfig.UseSpace || 300,
    Workspace: "/opt/miner-disk",
    UseCpu: minerConfig.useCpuCores || minerConfig.UseCpu || 0,
    StakingAcc: minerConfig.stakerAccount || minerConfig.stakingAcc || null,
    TeeList: minerConfig.reservedTws || minerConfig.TeeList || null,
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
      test: `["CMD", "nc", "-zv", "127.0.0.1", "${minerConfig.port}"]`,
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
