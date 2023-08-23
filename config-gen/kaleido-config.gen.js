const { imageTagByProfile } = require("../utils");
const { logger } = require("../logger");

const kaleidoHomePath = "/opt/cess/authority/kaleido";

async function genKaleidoComposeConfigs(config, _) {
  const kldCfg = config.kaleido;
  const kldServerIp = "172.18.0.3";
  const rotServerIp = "172.18.0.4";
  let agentCmds = [
    `--listen-address=/ip4/${rotServerIp}/tcp/10010`,
    `--kld-api-server-url=http://${kldServerIp}:7001`,
    `--cess-node-address=${config.node.chainWsUrl}`,
  ];
  let sgxVolumeMappings = [`${kaleidoHomePath}/key:/kaleido`];
  let agentVolumeMappings = [...sgxVolumeMappings];
  if (config.node.externalIp) {
    agentCmds.push(`--ext-address=/ip4/${config.node.externalIp}/tcp/10010`);
  }
  if (kldCfg.bootPeerIds) {
    agentCmds.push(`--boot-peer-ids=${kldCfg.bootPeerIds}`);
  }
  if (kldCfg.bootDnsaddr) {
    agentCmds.push(`--boot-dnsaddr=${kldCfg.bootDnsaddr}`);
  }
  if (kldCfg.allowLogCollection) {
    agentCmds.push("--allow-log-transport=1");
    agentVolumeMappings.push("/var/lib/docker/containers:/logs");
  }

  return [
    {
      image: `cesslab/kaleido:${imageTagByProfile(config.node.profile)}`,
      container_name: "kld-sgx",
      restart: "always",
      devices: ["/dev/sgx_enclave", "/dev/sgx_provision"],
      ports: [`${kldCfg.kldPort}:4001`],
      environment: [
        "RUST_LOG=debug,netlink_proto=info,libp2p_ping=info,multistream_select=info,libp2p_kad=info,yamux=info,libp2p_tcp=info,libp2p_dns=info,libp2p_swarm=info,rustls=info,h2=info",
        "RUST_BACKTRACE=full",
        `CTRL_WALLET_SEED=${kldCfg.controllerPhrase}`,
        `STAS_WALLET_ADDR=${kldCfg.stashAccount}`,
        `LISTEN_ADDRESS=/ip4/${kldServerIp}/tcp/4001`,
      ],
      networks: {
        kaleido: {
          ipv4_address: kldServerIp,
        },
      },
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
      container_name: "kld-agent",
      restart: "always",
      ports: [`${kldCfg.rotPort}:10010`],
      command: agentCmds,
      environment: [
        "RUST_LOG=debug,netlink_proto=info,libp2p_ping=info,multistream_select=info,libp2p_kad=info,yamux=info,libp2p_tcp=info,libp2p_dns=info,libp2p_swarm=info,rustls=info,h2=info",
        "RUST_BACKTRACE=full",
      ],
      networks: {
        kaleido: {
          ipv4_address: rotServerIp,
        },
      },
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
