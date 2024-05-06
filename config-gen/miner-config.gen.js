const { imageTagByProfile } = require('../utils')
const minerHomePath = "/opt/cess/storage/miner"

function ensureChainWsUrls(config) {
  // TODO: For compatibility, keep the deprecated node.chainWsUrl and node.backupChainWsUrls
  const chainWsUrl = config.miner.chainWsUrl || config.node.chainWsUrl;
  const backupChainWsUrls = config.miner.backupChainWsUrls || config.node.backupChainWsUrls || [];
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
  const apiConfig = {
    Rpc: ensureChainWsUrls(config),
    Port: config.miner.port,
    Boot: [config.miner.bootAddr || process.env["BUKET_BOOT"] || "_dnsaddr.bootstrap-kldr.cess.cloud"],
    Mnemonic: config.miner.signPhrase,
    EarningsAcc: config.miner.incomeAccount,
    UseSpace: config.miner.space,
    Workspace: "/opt/miner-disk",
    UseCpu: config.miner.useCpuCores || 0,
    StakingAcc: config.miner.stakerAccount || null,
    TeeList: config.miner.reservedTws || null,
  }
  return {
    config: apiConfig,
    paths: [{
      required: true,
      path: minerHomePath
    }]
  }
}

async function genMinerComposeConfig(config) {
  let args = [
    "run",
    "-c",
    "/opt/miner/config.yaml",
  ]
  if (config.miner.extraCmdArgs) {
    const extraCmdArgs = config.miner.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }
  return {
    image: 'cesslab/cess-miner:' + imageTagByProfile(config.node.profile),
    network_mode: 'host',
    restart: 'always',
    volumes: [
      minerHomePath + ':/opt/miner',
      config.miner.diskPath + ':/opt/miner-disk',
    ],
    command: args,
    logging: {
      driver: "json-file",
      options: {
        "max-size": "500m"
      }
    },
    healthcheck: {
      test: `["CMD", "nc", "-zv", "127.0.0.1", "${config.miner.port}"]`,
      interval: "1m",
      timeout: "10s",
      retries: 3
    },
  }
}

module.exports = {
  genMinerConfig,
  genMinerComposeConfig,
}
