const Joi = require("joi");
const {watchdogSchema} = require("../schema/watchdog.schema");
const watchdogHomePath = "/opt/cess/config/multiminer/watchdog"

async function getPublicIP(config) {
  const urls = [
    "https://api.seeip.org",
    "https://api.ipify.org?format=json",
    "https://api.my-ip.io/ip",
    "https://ip.zxinc.org/getip",
    "https://ip.3322.net/",
    "https://api.ipify.org?format=text",
    "https://api.ip.sb/ip"
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const ip = data.ip || data;
        return `http://${ip}:${config.watchdog.port}`;
      } else {
        const text = await response.text();
        const ip = text.trim();
        return `http://${ip}:${config.watchdog.port}`;
      }
    } catch (error) {
    }
  }
  return `http://127.0.0.1:${config.watchdog.port}`;
}

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
  apiUrl = config.watchdog.apiUrl ? config.watchdog.apiUrl : await getPublicIP(config)
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
