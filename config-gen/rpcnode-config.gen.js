const { imageTagByProfile } = require('../utils')
const fs = require('fs-extra')

function getRpcNodeHomePath(config) {
  const nodeMode = config.node.mode || "authority"
  return "/opt/cess/" + nodeMode + "/rpcnode"
}

async function genRpcNodeConfig(config, outputCfg) {
  return {
    config: config.rpcnode,
    paths: [{
      required: true,
      path: getRpcNodeHomePath(config),
    }],
  }
}

async function genRpcNodeComposeConfig(config) {
  let rpcNodeSpec = "cess-testnet"
  let volumes = [
    getRpcNodeHomePath(config) + ':/opt/cess/data'
  ];
  if (config.node.profile === "testnet") {
    rpcNodeSpec = config.rpcnode.chainSpec || "cess-testnet"
    // in the config-gen container enviroment
    const customSpecInCg = "/opt/app/etc/customSpecRaw.json";
    if (fs.pathExistsSync(customSpecInCg)) {
      volumes.push("/opt/cess/nodeadm/etc:/opt/cess/etc");
      rpcNodeSpec = "/opt/cess/etc/customSpecRaw.json";
    }
  }
  let args = [
    '--base-path',
    '/opt/cess/data',
    '--chain',
    rpcNodeSpec,
    '--port',
    `${config.rpcnode.port}`,
    '--name',
    `${config.rpcnode.name}`,
    '--rpc-port',
    '9944',
    '--execution',
    'WASM',
    '--wasm-execution',
    'compiled',
    '--in-peers',
    '75',
    '--out-peers',
    '75'
  ]

  if (config.node.mode === "authority") {
    args.push('--validator', '--pruning', 'archive')
  }
  else if (config.node.mode === "rpcnode" || config.node.mode === "watcher") {
    args.push('--pruning', `${config.rpcnode.pruning}`, '--rpc-max-connections', '2000', '--rpc-external', '--rpc-cors', 'all');
  }

  if (config.rpcnode.extraCmdArgs) {
    const extraCmdArgs = config.rpcnode.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }

  return {
    image: 'cesslab/cess-chain:' + imageTagByProfile(config.node.profile),
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
  genRpcNodeConfig,
  genRpcNodeComposeConfig
}
