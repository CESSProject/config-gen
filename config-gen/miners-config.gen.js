const { adapterToNativeConfig, doComposeConfigGenerate } = require('./miner-config.gen')
const minersHomePath = "/opt/cess/config/multiminer/miners"

async function genMinersConfig(config) {
  let minersConfigs = []
  for (let minerConfig of config.miners) {
    let cfg = adapterToNativeConfig(minerConfig, config.node)
    if (!cfg.chain.tees) {
      cfg.chain.tees = ["127.0.0.1:8080", "127.0.0.1:8081"]
    }
    minersConfigs.push(cfg)
  }
  return {
    config: minersConfigs,
    paths: [{
      required: true,
      path: minersHomePath
    }]
  }
}

async function genMinersComposeConfig(config) {
  let compCfgs = []
  config.miners.forEach((mc, i) => {
    let cc = doComposeConfigGenerate(mc, config.node, mc.diskPath + '/miner', mc.diskPath + '/storage')
    cc.container_name = `miner${i + 1}`
    compCfgs.push(cc)
  });
  return compCfgs
}

module.exports = {
  genMinersConfig,
  genMinersComposeConfig
}
