async function genWatchtowerComposeConfig() {
  let args = ["--cleanup", "--interval", "300"]
  return {
    image: 'cesslab/watchtower:latest',
    container_name: 'watchtower',
    network_mode: 'host',
    restart: 'always',
    volumes: [
      '/var/run/docker.sock:/var/run/docker.sock',
    ],
    command: args,
    logging: {
      driver: "json-file",
      options: {
        "max-size": "100m",
        "max-file": "7"
      }
    },
  }
}

module.exports = {
    genWatchtowerComposeConfig: genWatchtowerComposeConfig,
}
