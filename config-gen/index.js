/**
 * config generators
 */
const path = require("path");
const { writeConfig, chainHostName } = require("../utils");
const { genChainConfig, genChainComposeConfig } = require("./chain-config.gen");
const { genMinerConfig, genMinerComposeConfig } = require("./miner-config.gen");
const { genMinersConfig, genMinersComposeConfig } = require("./miners-config.gen");
const { genWatchdogConfig, genWatchdogComposeConfig } = require("./watchdog-config.gen");
const { genCesealComposeConfigs } = require("./ceseal-config.gen");
const { genNginxComposeConfigs } = require("./nginx-config.gen");
const { genWatchtowerComposeConfig } = require("./watchtower-config.gen");
const { genAutoHealComposeConfig } = require("./autoheal-config.gen");
const { genCacherConfig, genCacherComposeConfig } = require("./cacher-config.gen");
const { logger } = require("../logger");
const thirdPartyComponent = ["watchtower", "autoheal"]

/**
 * configuration of generators to use
 * name: the generator name
 *
 * async configFun(config, outputOptions) => {file, paths}
 * file: the result filename
 * paths: an array of files/directories should be verified later
 *    required: boolean whether this file is a mandontary requirement
 *    path: the file path
 *
 * async composeFunc(config) => composeConfig
 * return the service definition for this generator
 */
const configGenerators = [
  {
    name: "chain",
    configFunc: genChainConfig,
    to: path.join("chain", "config.json"),
    composeFunc: genChainComposeConfig,
  },
  {
    name: "miners",
    configFunc: genMinersConfig,
    to: path.join("miners", "config.yaml"),
    composeFunc: genMinersComposeConfig,
  },
  {
    name: "miner",
    configFunc: genMinerConfig,
    to: path.join("miner", "config.yaml"),
    composeFunc: genMinerComposeConfig,
  },
  {
    name: "ceseal",
    composeFunc: genCesealComposeConfigs,
  },
  {
    name: "nginx",
    composeFunc: genNginxComposeConfigs,
  },
  {
    name: "watchtower",
    composeFunc: genWatchtowerComposeConfig,
  },
  {
    name: "autoheal",
    composeFunc: genAutoHealComposeConfig,
  },
  {
    name: "watchdog",
    configFunc: genWatchdogConfig,
    to: path.join("watchdog", "config.yaml"),
    composeFunc: genWatchdogComposeConfig,
  },
  {
    name: "cacher",
    configFunc: genCacherConfig,
    to: path.join("cacher", "config.yaml"),
    composeFunc: genCacherComposeConfig,
  },
];

async function genConfig(config, outputOpts) {
  // application config generation
  let outputs = [];
  const { baseDir } = outputOpts;
  for (const cg of configGenerators) {
    if (!config[cg.name] || !cg.configFunc) {
      continue;
    }
    const ret = await cg.configFunc(config);
    if (ret) {
      await writeConfig(path.join(baseDir, cg.to), ret.config);
    }
    outputs.push({
      generator: cg.name,
      ...ret,
    });
  }

  logger.info("Generating configurations done");
  return outputs;
}

async function genComposeConfig(config) {
  const mode = config.node.mode;
  const isExternalChain = config.node.externalChain;
  if (!isExternalChain && !config.chain) {
    throw new Error("Set to use local chain but without corresponding configuration");
  }
  // docker compose config generation
  let output = {
    name: `cess-${mode}`,
    services: {},
  };

  var hasCesealNetwork = false;
  let buildComposeService = function (serviceCfg, name, struct) {
    if (!serviceCfg["container_name"]) {
      serviceCfg["container_name"] = name;
    }
    if (serviceCfg.networks && serviceCfg.networks.indexOf("ceseal") !== -1) {
      hasCesealNetwork = true;
    }
    return {
      ...struct,
      services: {
        ...struct.services,
        [serviceCfg.container_name]: serviceCfg,
      },
    };
  };

  for (const cg of configGenerators) {
    if (!(config[cg.name] || thirdPartyComponent.includes(cg.name))) {
      continue;
    }
    if ((cg.name === "watchdog" && !config.watchdog.enable) || (cg.name === "cacher" && !config.cacher.enable)) {
      continue
    }
    if (isExternalChain && cg.name === "chain" && mode !== "rpcnode") {  // RPC-Node mode is not affected by 'node.externalChain'
      continue;
    }
    const serviceCfg = await cg.composeFunc(config);
    if (Array.isArray(serviceCfg)) {
      serviceCfg.forEach(
        (e) => (output = buildComposeService(e, cg.name, output))
      );
    } else {
      output = buildComposeService(serviceCfg, cg.name, output);
    }
  }
  if (hasCesealNetwork) {
    output["networks"] = {
      ceseal: {
        name: "ceseal",
        driver: "bridge",
      },
    };
    let chain = output["services"]?.chain;
    if (chain) {
      const chainPort = config.chain.port;
      delete chain.network_mode;
      chain["hostname"] = chainHostName;
      chain["networks"] = ["ceseal"]
      chain["ports"] = ["9615:9615", "9944:9944", `${chainPort}:${chainPort}`];
      let chainCmd = chain.command;
      if (Array.isArray(chainCmd)) {
        chainCmd.push("--rpc-methods", "unsafe");
      }
    }
  }

  handleContainersToWatch(output, config?.node?.noWatchContainers);

  logger.info("Generating docker compose file done");

  return output;
}

function handleContainersToWatch(dockerComposeConfig, noWatchContainers) {
  let watchtowerSvc = dockerComposeConfig.services["watchtower"];
  if (!watchtowerSvc) {
    console.assert(watchtowerSvc);
    return;
  }
  const containers = [];
  noWatchContainers = new Array(...(noWatchContainers || []));
  for (const [_, val] of Object.entries(dockerComposeConfig.services)) {
    const containerName = val.container_name;
    if (
      containerName !== "watchtower" &&
      noWatchContainers.indexOf(containerName) === -1
    ) {
      containers.push(containerName);
    }
  }
  watchtowerSvc.command.push("--enable-lifecycle-hooks", ...containers);
}

module.exports = {
  genConfig,
  genComposeConfig,
};
