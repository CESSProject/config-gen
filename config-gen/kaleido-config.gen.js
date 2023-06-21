const { imageTagByProfile } = require("../utils");
const { logger } = require("../logger");

const kaleidoHomePath = "/opt/cess/authority/kaleido";

async function genKaleidoComposeConfigs(config, _) {
  const kldCfg = config.kaleido;
  const workDir = kldCfg.workDir || `${kaleidoHomePath}/data`;
  let agentCmds = [
    `--listen-address=/ip4/172.18.0.4/tcp/10010`,
    `--cess-node-address=${config.node.chainWsUrl}`,
    `--controller-wallet-seed=${kldCfg.controllerPhrase}`,
    `--stash-wallet-address=${kldCfg.stashAccount}`,
    `--ext-address=/ip4/${config.node.externalIp}/tcp/10010`,
  ];
  if (kldCfg.bootPeerIds) {
    agentCmds.push(`--boot-peer-ids=${kldCfg.bootPeerIds}`);
  }
  if (kldCfg.bootDnsaddr) {
    agentCmds.push(`--boot-dnsaddr=${kldCfg.bootDnsaddr}`);
  }

  return [
    kld_kafka_cfg,
    {
      image: `cesslab/kaleido:${imageTagByProfile(config.node.profile)}`,
      container_name: "kld-sgx",
      restart: "always",
      devices: ["/dev/sgx_enclave", "/dev/sgx_provision"],
      ports: [`${kldCfg.kldPort}:4001`],
      environment: ["RUST_LOG=debug", "RUST_BACKTRACE=1"],
      networks: {
        kaleido: {
          ipv4_address: "172.18.0.3",
        },
      },
      volumes: [`${workDir}:/sgx`, `${kaleidoHomePath}/key:/kaleido`],
      depends_on: ["kaleido-kafka"],
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
      container_name: "kld-agent",
      restart: "always",
      ports: [`${kldCfg.rotPort}:10010`],
      command: agentCmds,
      environment: [
        "RUST_LOG=debug,netlink_proto=info,libp2p_ping=info,multistream_select=info",
        "RUST_BACKTRACE=1",
      ],
      networks: {
        kaleido: {
          ipv4_address: "172.18.0.4",
        },
      },
      volumes: [`${workDir}:/sgx`, `${kaleidoHomePath}/key:/kaleido`],
      depends_on: ["kld-sgx"],
      logging: {
        driver: "json-file",
        options: {
          "max-size": "300m",
          "max-file": "10",
        },
      },
    },
  ];
}

const kld_kafka_cfg = {
  image: "cesslab/kaleido-kafka:dev",
  container_name: "kaleido-kafka",
  environment: {
    ADVERTISED_HOST: "kaleido-kafka",
    NUM_PARTITIONS: 1,
  },
  networks: {
    kaleido: {
      ipv4_address: "172.18.0.2",
    },
  },
  expose: ["2181", "9092"],
  logging: {
    driver: "json-file",
    options: {
      "max-size": "300m",
      "max-file": "5",
    },
  },
};

module.exports = {
  genKaleidoComposeConfigs: genKaleidoComposeConfigs,
};
