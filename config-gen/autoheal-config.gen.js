async function genAutoHealComposeConfig(config, outputCfg) {
  return {
    image: 'willfarrell/autoheal:latest',
    container_name: 'autoheal',
    network_mode: 'host',
    tty: true,
    restart: 'always',
    volumes: [
      '/var/run/docker.sock:/var/run/docker.sock',
    ],
    environment: [
      'AUTOHEAL_CONTAINER_LABEL=all',
      'AUTOHEAL_INTERVAL=60',
      'AUTOHEAL_START_PERIOD=180',
      'AUTOHEAL_DEFAULT_STOP_TIMEOUT=10',
    ],
  }
}

module.exports = {
  genAutoHealComposeConfig: genAutoHealComposeConfig,
}
