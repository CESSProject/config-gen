const { imageTagByProfile } = require("../utils");
const { logger } = require("../logger");

const kaleidoHomePath = "/opt/cess/authority/kaleido";

async function genKaleidoComposeConfigs(config, _) {
  const kldCfg = config.kaleido;
  const kldHostname = "kld-sgx";
  const rotHostname = "kld-agent";
  let agentCmds = [
    `--kldr-endpoint=${kldCfg.kldrEndpoint}`,
    `--kld-endpoint=http://${kldHostname}:7001`,
    `--cess-node-address=${config.node.chainWsUrl}`,
    `--controller-wallet-seed=${kldCfg.controllerPhrase}`,
    `--stash-wallet-address=${kldCfg.stashAccount}`,
  ];
  let sgxVolumeMappings = [`${kaleidoHomePath}/key:/kaleido`];
  let agentVolumeMappings = [...sgxVolumeMappings];
  if (kldCfg.allowLogCollection) {
    agentCmds.push("--allow-log-transport=1");
    agentVolumeMappings.push("/var/lib/docker/containers:/logs");
  }

  return [
    {
      image: `cesslab/kaleido:${imageTagByProfile(config.node.profile)}`,
      container_name: kldHostname,
      hostname: kldHostname,
      restart: "always",
      devices: ["/dev/sgx_enclave", "/dev/sgx_provision"],
      expose: [7001],
      ports: [`${kldCfg.p2pPort}:4001`],
      environment: [
        "RUST_LOG=debug",
        "RUST_BACKTRACE=full",
        `CTRL_WALLET_SEED=${kldCfg.controllerPhrase}`,
        `CESS_NODE_ADDRESS=${config.node.chainWsUrl}`,
        `PODR2_MAX_THREAD=${kldCfg.podr2MaxThreads}`,
        `LISTEN_ADDRESS=/ip4/${kldHostname}/tcp/4001`,  //FIXME: the libp2p's listener address must be a resolved IP rather than a hostname
      ],
      networks: ["kaleido"],
      volumes: sgxVolumeMappings,
      logging: {
        driver: "json-file",
        options: {
          "max-size": "300m",
          "max-file": "10",
        },
      },
    },
    {
      image: `cesslab/kaleido-rotator:${imageTagByProfile(
        config.node.profile
      )}`,
      container_name: rotHostname,
      hostname: rotHostname,
      restart: "always",
      ports: [`${kldCfg.apiPort}:10010`],
      command: agentCmds,
      environment: ["RUST_LOG=debug", "RUST_BACKTRACE=full"],
      networks: ["kaleido"],
      extra_hosts: ["host.docker.internal:host-gateway"],
      volumes: agentVolumeMappings,
      depends_on: ["kld-sgx"],
      logging: {
        driver: "json-file",
        options: {
          "max-size": "500m",
          "max-file": "10",
        },
      },
    },
  ];
}

module.exports = {
  genKaleidoComposeConfigs: genKaleidoComposeConfigs,
};
