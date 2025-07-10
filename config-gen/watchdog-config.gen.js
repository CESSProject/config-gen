const Joi = require("joi");
const {watchdogSchema} = require("../schema/watchdog.schema");
const watchdogHomePath = "/opt/cess/config/multiminer/watchdog"
const { getPublicEndpoint } = require("../utils");

async function genWatchdogConfig(config) {
  function extractedData() {
    let copyConfig = JSON.parse(JSON.stringify(config.watchdog)); // must use deep copy
    let updatedWatchdogSchema = watchdogSchema.keys({
      enable: Joi.any().strip(),
      apiUrl: Joi.any().strip()
    });
    updatedWatchdogSchema.port = copyConfig.port
    updatedWatchdogSchema.external = copyConfig.external
    updatedWatchdogSchema.enable = copyConfig.enable
    updatedWatchdogSchema.scrapeInterval = copyConfig.scrapeInterval
    updatedWatchdogSchema.hosts = copyConfig.hosts
    updatedWatchdogSchema.alert = copyConfig.alert
    updatedWatchdogSchema.auth = copyConfig.auth
    return updatedWatchdogSchema;
  }

  if (!config.watchdog.enable) {
    return null
  } else {
    let updatedWatchdog = extractedData();
    for (let i = 0; i < config.watchdog.hosts.length; i++) {
      if (config.watchdog.hosts[i].ca_path && config.watchdog.hosts[i].cert_path && config.watchdog.hosts[i].key_path) {
        updatedWatchdog.hosts[i].ca_path = `/opt/cess/watchdog/tls/${config.watchdog.hosts[i].ca_path.split("/").pop()}`;
        updatedWatchdog.hosts[i].cert_path = `/opt/cess/watchdog/tls/${config.watchdog.hosts[i].cert_path.split("/").pop()}`;
        updatedWatchdog.hosts[i].key_path = `/opt/cess/watchdog/tls/${config.watchdog.hosts[i].key_path.split("/").pop()}`;
      }
    }
    let newWatchdogSchema = watchdogSchema.keys({
      enable: Joi.any().strip(),
      apiUrl: Joi.any().strip()
    });
    return {
      config: await newWatchdogSchema.validateAsync(updatedWatchdog, {allowUnknown: true, stripUnknown: true}),
      paths: [{
        required: true,
        path: watchdogHomePath
      }]
    }
  }
}

async function genWatchdogComposeConfig(config) {
  if (!config.watchdog.enable) {
    return
  }
  let apiUrl
  apiUrl = config.watchdog.apiUrl ? config.watchdog.apiUrl : getPublicEndpoint(config.watchdog.port)
  let watchdog = []
  let watchVolumeMappings = [`/opt/cess/mineradm/build/watchdog/config.yaml:/opt/cess/watchdog/config.yaml`];
  for (let i = 0; i < config.watchdog.hosts.length; i++) {
    if (config.watchdog.hosts[i].ca_path && config.watchdog.hosts[i].cert_path && config.watchdog.hosts[i].key_path) {
      watchVolumeMappings.push(`${config.watchdog.hosts[i].ca_path}:/opt/cess/watchdog/tls/${config.watchdog.hosts[i].ca_path.split("/").pop()}`);
      watchVolumeMappings.push(`${config.watchdog.hosts[i].cert_path}:/opt/cess/watchdog/tls/${config.watchdog.hosts[i].cert_path.split("/").pop()}`);
      watchVolumeMappings.push(`${config.watchdog.hosts[i].key_path}:/opt/cess/watchdog/tls/${config.watchdog.hosts[i].key_path.split("/").pop()}`);
    }
  }
  watchdog[0] = {
    container_name: `watchdog-web`,
    image: 'cesslab/watchdog-web:latest',
    network_mode: 'host',
    restart: 'always',
    environment: [
      `NEXT_PUBLIC_API_URL=${apiUrl}`,
    ],
    logging: {
      driver: "json-file",
      options: {
        "max-size": "100m",
        "max-file": '7'
      }
    },
    healthcheck: {
      test: `["CMD", "nc", "-zv", "127.0.0.1", "13080"]`,
      interval: "1m",
      timeout: "10s",
      retries: 3
    },
  }
  watchdog[1] = {
    container_name: `watchdog`,
    image: 'cesslab/watchdog:latest',
    network_mode: 'host',
    restart: 'always',
    volumes: watchVolumeMappings,
    logging: {
      driver: "json-file",
      options: {
        "max-size": "100m",
        "max-file": '7'
      }
    },
    healthcheck: {
      test: `["CMD", "nc", "-zv", "127.0.0.1", "${config.watchdog.port}"]`,
      interval: "1m",
      timeout: "10s",
      retries: 3
    },
  }
  return watchdog
}

module.exports = {
  genWatchdogConfig,
  genWatchdogComposeConfig
}
