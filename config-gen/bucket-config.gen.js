const { imageTagByProfile } = require('../utils')
const bucketHomePath = "/opt/cess/storage/bucket"

function ensureChainWsUrls(config) {
  // TODO: For compatibility, keep the deprecated node.chainWsUrl and node.backupChainWsUrls
  const chainWsUrl = config.bucket.chainWsUrl || config.node.chainWsUrl;
  const backupChainWsUrls = config.bucket.backupChainWsUrls || config.node.backupChainWsUrls || [];
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

async function genBucketConfig(config) {
  const apiConfig = {
    Rpc: ensureChainWsUrls(config),
    Port: config.bucket.port,
    Boot: [config.bucket.bootAddr || process.env["BUKET_BOOT"] || "_dnsaddr.bootstrap-kldr.cess.cloud"],
    Mnemonic: config.bucket.signPhrase,
    EarningsAcc: config.bucket.incomeAccount,
    UseSpace: config.bucket.space,
    Workspace: "/opt/bucket-disk",
    UseCpu: config.bucket.useCpuCores || 0,
    StakingAcc: config.bucket.stakerAccount || null,
    TeeList: config.bucket.reservedTws || null,
  }
  return {
    config: apiConfig,
    paths: [{
      required: true,
      path: bucketHomePath
    }]
  }
}

async function genBucketComposeConfig(config) {
  let args = [
    "run",
    "-c",
    "/opt/bucket/config.yaml",
  ]
  if (config.bucket.extraCmdArgs) {
    const extraCmdArgs = config.bucket.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }
  return {
    image: 'cesslab/cess-bucket:' + imageTagByProfile(config.node.profile),
    network_mode: 'host',
    restart: 'always',
    volumes: [
      bucketHomePath + ':/opt/bucket',
      config.bucket.diskPath + ':/opt/bucket-disk',
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

module.exports = {
  genBucketConfig,
  genBucketComposeConfig,
}
