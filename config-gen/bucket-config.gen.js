const bucketHomePath = "/opt/cess/storage/bucket"

async function genBucketConfig(config, outputCfg) {
  const apiConfig = {
    RpcAddr: config.node.chainWsUrl,
    ServiceIP: config.node.externalIp,
    ServicePort: config.bucket.port,
    DomainName: config.node.domainName,
    SignatureAcc: config.bucket.signPhrase,
    IncomeAcc: config.bucket.incomeAccount,
    StorageSpace: config.bucket.space,
    MountedPath: "/opt/bucket-disk",
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
    "./cess-bucket",
    "run",
    "-c", 
    "/opt/bucket/config.toml",
  ]
  if (config.bucket.extraCmdArgs) {
    const extraCmdArgs = config.bucket.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }
  return {
    image: 'cesslab/cess-bucket:latest',
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
