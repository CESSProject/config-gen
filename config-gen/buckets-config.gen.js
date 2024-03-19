const {imageTagByProfile} = require('../utils')
const bucketsHomePath = "/opt/cess/storage/buckets"

function ensureChainWsUrlsInMultibucketMode(config, index) {
  // TODO: For compatibility, keep the deprecated node.chainWsUrl and node.backupChainWsUrls
  const chainWsUrl = config.buckets[index].chainWsUrl || config.node.chainWsUrl;
  const backupChainWsUrls = config.buckets[index].backupChainWsUrls || config.node.backupChainWsUrls || [];
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

async function genBucketsConfig(config) {
  let len = config.buckets.length
  const buckets = []
  for (let i = 0; i < len; i++) {
    buckets[i] = {
      Name: config.buckets[i].name || null,
      Port: config.buckets[i].port,
      EarningsAcc: config.buckets[i].earningsAcc || config.buckets[i].incomeAccount,
      StakingAcc: config.buckets[i].stakingAcc || config.buckets[i].stakerAccount || null,
      Mnemonic: config.buckets[i].mnemonic || config.buckets[i].signPhrase,
      Rpc: ensureChainWsUrlsInMultibucketMode(config, i),
      UseSpace: config.buckets[i].UseSpace || 300,
      Workspace: "/opt/bucket-disk",
      UseCpu: config.buckets[i].UseCpu || 0,
      TeeList: config.buckets[i].TeeList || ["127.0.0.1:8080", "127.0.0.1:8081"],
      Boot: [config.buckets[i].Boot || config.buckets[i].bootAddr || process.env["BUKET_BOOT"] || "_dnsaddr.bootstrap-kldr.cess.cloud"],
    }
  }
  return {
    config: buckets,
    paths: [{
      required: true,
      path: bucketsHomePath
    }]
  }
}

async function genBucketsComposeConfig(config) {
  let len = config.buckets.length
  let buckets_services = []
  for (let i = 0; i < len; i++) {
    let args = [
      "run",
      "-c",
      "/opt/bucket/config.yaml",
    ]
    if (config.buckets[i].extraCmdArgs) {
      const extraCmdArgs = config.buckets[i].extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
      args.push(...extraCmdArgs);
    }
    buckets_services[i] = {
      container_name: `bucket_${i+1}`,
      image: 'cesslab/cess-bucket:' + imageTagByProfile(config.node.profile),
      network_mode: 'host',
      restart: 'always',
      volumes: [
        config.buckets[i].diskPath + '/bucket' + ':/opt/bucket',
        config.buckets[i].diskPath + '/storage'+ ':/opt/bucket-disk',
      ],
      command: args,
      logging: {
        driver: "json-file",
        options: {
          "max-size": "500m"
        }
      },
    }
  }
  return buckets_services
}

module.exports = {
  genBucketsConfig,
  genBucketsComposeConfig
}
