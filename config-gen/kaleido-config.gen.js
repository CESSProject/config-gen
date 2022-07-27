const { logger } = require('../logger')

const kaleidoHomePath = '/opt/cess/authority/kaleido'

async function genKaleidoConfig(config, outputCfg) {
  return {
    config: config.kaleido,
    paths: [{
      required: true,
      path: kaleidoHomePath,
    }],
  }
}

async function genKaleidoComposeConfig(config, outputCfg) {
  let args = []
  if (config.kaleido.extraCmdArgs) {
    const extraCmdArgs = config.kaleido.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }
  let devices = [];
  const sgxDevices = config.kaleido.sgxDevices;
  if (sgxDevices && sgxDevices.length > 0) {
    devices.push(...sgxDevices);
  } else {
    logger.warn("the sgxDevices is empty");
  }
  return {
    image: 'cesslab/cess-kaleido:latest',
    network_mode: 'host',
    restart: 'always',
    volumes: [
      kaleidoHomePath + ':/opt/kaleido',
    ],
    devices: devices,
    command: args,
    logging: {
      driver: "json-file",
      options: {
        "max-size": "300m",
        "max-file": "10"
      }
    },
  }
}


module.exports = {
  genKaleidoConfig,
  genKaleidoComposeConfig,
}