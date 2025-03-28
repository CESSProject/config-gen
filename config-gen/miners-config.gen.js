const { adapterToNativeConfig, doComposeConfigGenerate } = require('./miner-config.gen')
const minersHomePath = "/opt/cess/config/multiminer/miners"

async function genMinersConfig(config) {
  let minersConfigs = []
  for (let minerConfig of config.miners) {
    minersConfigs.push(adapterToNativeConfig(minerConfig, config.node))
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
