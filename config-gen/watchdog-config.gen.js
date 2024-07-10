const {func} = require("joi");
const Joi = require("joi");
const {watchdogSchema} = require("../schema/watchdog.schema");
const yaml = require("js-yaml");
const watchdogHomePath = "/opt/cess/watchdog"

async function getPublicIP() {
  const urls = [
    {url: "https://api.ip.sb/ip", type: "text"},
    {url: "https://api.ipify.org?format=text", type: "text"},
    {url: "https://ip.3322.net/", type: "text"},
    {url: "https://ip.zxinc.org/getip", type: "text"},
    {url: "https://ip4.seeip.org/", type: "text"},
    {url: "https://ip.seeip.org/", type: "text"},
    {url: "https://api.my-ip.io/ip", type: "text"},
    {url: "https://api.ipify.org?format=json", type: "text", key: "ip"},
  ];

  for (const {url, type, key} of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }
      if (type === "json") {
        const data = await response.json();
        return key ? data[key] : data;
      } else {
        const text = await response.text();
        return text.trim();
      }
    } catch (error) {
      console.error(`Failed to get IP from ${url}:`, error);
    }
  }
  throw new Error("Failed to get public IP from all sources");
}

async function genWatchdogConfig(config) {
  if (!config.watchdog.enable) {
    return null
  } else {
    let updatedWatchdogSchema = watchdogSchema.keys({
      enable: Joi.any().strip(),
      apiUrl: Joi.any().strip()
    });
    updatedWatchdogSchema.port = config.watchdog.port
    updatedWatchdogSchema.external = config.watchdog.external
    updatedWatchdogSchema.enable = config.watchdog.enable
    updatedWatchdogSchema.scrapeInterval = config.watchdog.scrapeInterval
    updatedWatchdogSchema.hosts = config.watchdog.hosts
    updatedWatchdogSchema.alert = config.watchdog.alert
    return {
      config: await updatedWatchdogSchema.validateAsync(updatedWatchdogSchema, {allowUnknown: true, stripUnknown: true}),
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
  apiUrl = config.watchdog.apiUrl ? config.watchdog.apiUrl : await getPublicIP()
  let watchdog = []
  let watchVolumeMappings = [`${watchdogHomePath}:/opt/watchdog`];
  for (let i = 0; i < config.watchdog.hosts.length; i++) {
    if (config.watchdog.hosts[i].ca_path && config.watchdog.hosts[i].cert_path && config.watchdog.hosts[i].key_path) {
      watchVolumeMappings.push(`${config.watchdog.hosts[i].ca_path}:/opt/watchdog/tls/${config.watchdog.hosts[i].ca_path.split("/").pop()}`);
      watchVolumeMappings.push(`${config.watchdog.hosts[i].cert_path}:/opt/watchdog/tls/${config.watchdog.hosts[i].cert_path.split("/").pop()}`);
      watchVolumeMappings.push(`${config.watchdog.hosts[i].key_path}:/opt/watchdog/tls/${config.watchdog.hosts[i].key_path.split("/").pop()}`);
    }
  }
  watchdog[0] = {
    container_name: `watchdog-web`,
    image: 'cesslab/watchdog-web:latest',
    network_mode: 'host',
    restart: 'always',
    environment: [
      `- API_URL=http://${apiUrl}:${config.watchdog.port}`,
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
