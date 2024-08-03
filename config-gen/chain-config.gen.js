const {imageTagByProfile} = require('../utils')
const fs = require('fs-extra')

function getChainHomePath(config) {
  const nodeMode = config.node.mode || "authority"
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
    '32'
  ]

  if (config.node.mode === "authority") {
    args.push('--validator', '--pruning', 'archive')
  } else if (config.node.mode === "rpcnode" || config.node.mode === "watcher" || config.node.mode === "multiminer") {
    args.push('--pruning', `${config.chain.pruning}`, '--rpc-max-connections', '65535', '--rpc-external', '--rpc-cors', 'all');
  }

  if (config.chain.extraCmdArgs) {
    const extraCmdArgs = config.chain.extraCmdArgs.split(' ').map(e => e.trim()).filter(e => e !== '');
    args.push(...extraCmdArgs);
  }

  //ownnet just for devleper testing the new feature just finished,so just use simply argument run
  if (config.node.profile == "ownnet") {
    let arg = [
      '--dev',
      '--state-pruning',
      'archive',
    ]
    return {
      image: 'cesslab/cess-chain:' + imageTagByProfile(config.node.profile),
      network_mode: 'host',
      command: arg,
      logging: {
        driver: "json-file",
        options: {
          "max-size": "300m",
          "max-file": "10"
        }
      },
    }
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
