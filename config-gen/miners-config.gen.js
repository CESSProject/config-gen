const {imageTagByProfile} = require('../utils')
const minersHomePath = "/opt/cess/config/multiminer/miners"

function ensureChainWsUrlsInMultiminerMode(config, index) {
  // TODO: For compatibility, keep the deprecated node.chainWsUrl and node.backupChainWsUrls
  const chainWsUrl = config.miners[index].chainWsUrl || config.node.chainWsUrl;
  const backupChainWsUrls = config.miners[index].backupChainWsUrls || config.node.backupChainWsUrls || [];
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

async function genMinersConfig(config) {
  let len = config.miners.length
  const miners = []
  for (let i = 0; i < len; i++) {
    miners[i] = {
      Name: config.miners[i].name || `miner${i+1}`,
      Port: config.miners[i].port,
      EarningsAcc: config.miners[i].earningsAcc || config.miners[i].incomeAccount,
      StakingAcc: config.miners[i].stakingAcc || config.miners[i].stakerAccount || null,
      Mnemonic: config.miners[i].mnemonic || config.miners[i].signPhrase,
      Rpc: ensureChainWsUrlsInMultiminerMode(config, i),
      UseSpace: config.miners[i].UseSpace || config.miners[i].space || 300,
      Workspace: "/opt/miner-disk",
      UseCpu: config.miners[i].UseCpu || 0,
      TeeList: config.miners[i].TeeList || ["127.0.0.1:8080", "127.0.0.1:8081"],
      Boot: [config.miners[i].Boot || config.miners[i].bootAddr || process.env["BUKET_BOOT"] || "_dnsaddr.bootstrap-kldr.cess.cloud"],
    }
  }
  return {
    config: miners,
    paths: [{
      required: true,
      path: minersHomePath
    }]
  }
}

async function genMinersComposeConfig(config) {
  let len = config.miners.length
  let miners_services = []
  for (let i = 0; i < len; i++) {
    let args = [
      "run",
      "-c",
      "/opt/miner/config.yaml",
    ]
    if (config.miners[i].extraCmdArgs) {
      const extraCmdArgs = config.miners[i].extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
      args.push(...extraCmdArgs);
    }
    miners_services[i] = {
      container_name: `miner${i+1}`,
      image: 'cesslab/cess-miner:' + imageTagByProfile(config.node.profile),
      network_mode: 'host',
      restart: 'always',
      volumes: [
        config.miners[i].diskPath + '/miner' + ':/opt/miner',
        config.miners[i].diskPath + '/storage'+ ':/opt/miner-disk',
      ],
      command: args,
      logging: {
        driver: "json-file",
        options: {
          "max-size": "500m"
        }
      },
      healthcheck: {
        test: `["CMD", "nc", "-zv", "127.0.0.1", "${config.miners[i].port}"]`,
        interval: "1m",
        timeout: "10s",
        retries: 3
      },
    }
  }
  return miners_services
}

module.exports = {
  genMinersConfig,
  genMinersComposeConfig
}
