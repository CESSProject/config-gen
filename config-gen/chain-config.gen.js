const { imageTagByProfile } = require('../utils')
const fs = require('fs-extra')

function getChainHomePath(config) {
  const nodeMode = config.node.mode || "tee"
  if (nodeMode === "multiminer") {
    // when press tab in linux, it can distinguish /opt/cess/data and /opt/cess/minersadm
    return "/opt/cess/config/" + nodeMode + "/chain"
  }
  return "/opt/cess/" + nodeMode + "/chain"
}

async function genChainConfig(config) {
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
  if (config.node.profile === "devnet") {
    chainSpec = config.chain.chainSpec || "cess-devnet"
    // in the config-gen container environment
    const customSpecInCg = "/opt/app/etc/customSpecRaw.json";
    if (fs.pathExistsSync(customSpecInCg)) {
      volumes.push("/opt/cess/nodeadm/etc:/opt/cess/etc");
      chainSpec = "/opt/cess/etc/customSpecRaw.json";
    }
  }
  let args = [
    '--base-path',
    '/opt/cess/data',
    '--chain',
    chainSpec,
    '--port',
    `${config.chain.port}`,
    '--name',
    `${config.chain.name}`,
    '--rpc-port',
    '9944',
    '--execution',
    'WASM',
    '--wasm-execution',
    'compiled',
    '--in-peers',
    '75',
    '--out-peers',
    '75',
    '--rpc-max-response-size',
    '256',
    '--prometheus-external'
  ]

  if (config.node.mode === "tee") {
    args.push('--validator', '--state-pruning', 'archive')
  } else if (config.node.mode === "validator") {
    args.push('--max-runtime-instances', '32', '--validator', '--state-pruning', 'archive');
  } else if (config.node.mode === "rpcnode") {
    args.push('--state-pruning', `${config.chain.pruning}`, '--rpc-max-connections', '65535', '--rpc-external', '--rpc-cors', 'all');
  } else if (config.node.mode === "multiminer" || config.node.mode === "storage") {
    args.push('--state-pruning', 'archive', '--rpc-max-connections', '65535', '--rpc-external', '--rpc-cors', 'all');
  } else {
    throw new Error(`Unsupported node mode: ${config.node.mode}`);
  }

  if (config.chain.extraCmdArgs) {
    const extraCmdArgs = config.chain.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
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
  genChainConfig,
  genChainComposeConfig,
}
