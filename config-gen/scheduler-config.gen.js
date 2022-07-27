const schedulerHomePath = '/opt/cess/authority/scheduler'

async function genSchedulerConfig(config, outputCfg) {
  const cfg = {
    RpcAddr: config.node.chainWsUrl,
    ServiceAddr: config.node.externalIp,
    ServicePort: config.scheduler.port,
    CtrlPrk: config.scheduler.controllerPhrase,
    StashAcc: config.scheduler.stashAccount,
    DataDir: "/opt/scheduler",
  }
  return {
    config: cfg,
    paths: [{
      required: true,
      path: schedulerHomePath,
    }],
  }
}

async function genSchedulerComposeConfig(config) {
  let args = [
    "./cess-scheduler",
    "run",
    "-c",
    "/opt/scheduler/config.toml"
  ]
  if (config.scheduler.extraCmdArgs) {
    const extraCmdArgs = config.scheduler.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }
  return {
    image: 'cesslab/cess-scheduler:latest',
    network_mode: 'host',
    restart: 'always',
    volumes: [
      schedulerHomePath + ':/opt/scheduler',
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
  genSchedulerConfig,
  genSchedulerComposeConfig,
}
