const fs = require('fs-extra')

function getChainHomePath(config) {
  const nodeMode = config.node.mode || "authority"
  return "/opt/cess/" + nodeMode + "/chain"
}

async function genChainConfig(config, outputCfg) {
  return {
    config: config.chain,
    paths: [{
      required: true,
      path: getChainHomePath(config),
    }],
  }
}

async function genChainComposeConfig(config) {
  let chainSpec = "cess-testnet"
  let volumes = [
    getChainHomePath(config) + ':/opt/cess/data'
  ];
  if (config.node.profile == "dev") {
    // in the config-gen container enviroment
    const customSpecInCg = "/opt/app/etc/customSpecRaw.json";
    if (fs.pathExistsSync(customSpecInCg)) {
      volumes.push("/opt/cess/nodeadm/etc:/opt/cess/etc");
      chainSpec = "/opt/cess/etc/customSpecRaw.json";
    }
  }
  let args = [
    './cess-node',
    '--base-path',
    '/opt/cess/data',
    '--chain',
    chainSpec,
    '--port',
    `${config.chain.port}`,
    '--name',
    `${config.chain.name}`,
    '--rpc-port',
    '9933',
    '--ws-port',
    '9948',
    '--execution',
    'WASM',
    '--wasm-execution',
    'compiled',
    '--in-peers',
    '75',
    '--out-peers',
    '75'
  ]

  if (config.node.mode == "authority") {
    args.push('--validator', '--pruning', 'archive')
  }
  else if (config.node.mode == "watcher") {
    args.push('--no-telemetry', '--pruning', '8000', '--ws-max-connections', '500', '--ws-external', '--rpc-external', '--rpc-cors', 'all');
  }

  if (config.chain.extraCmdArgs) {
    const extraCmdArgs = config.chain.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }

  return {
    image: 'cesslab/cess-chain:latest',
    network_mode: 'host',
    volumes: volumes,
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
  genChainConfig,
  genChainComposeConfig,
}
