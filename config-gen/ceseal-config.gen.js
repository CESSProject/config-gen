const { imageTagByProfile, chainHostName } = require("../utils");

const cesealHomePath = "/opt/cess/authority/ceseal";

async function genCesealComposeConfigs(config, _) {
  const specCfg = config.ceseal;
  let chainWsUrl = specCfg.chainWsUrl;
  if (!config.node.externalChain && chainWsUrl.indexOf(chainHostName) === -1) {
    chainWsUrl = `ws://${chainHostName}:9944`
  }
  const cesealHostname = "ceseal";
  const cifrostHostname = "cifrost";
  let cesealCmds = [
    "--chain-ws-endpoint", `${chainWsUrl}`,
    "--internal-endpoint", `http://ceseal:8000`,
    "--attestation-provider", `${specCfg.raType}`,
    "--public-endpoint", `${specCfg.endpointOnChain}`,
    "--mnemonic", `${specCfg.mnemonic}`,
  ];
  if (specCfg.stashAccount) {
    cesealCmds.push("--operator", `${specCfg.stashAccount}`);
  }

  return [
    {
      image: `cesslab/ceseal:${imageTagByProfile(config.node.profile)}`,
      container_name: cesealHostname,
      hostname: cesealHostname,
      restart: "always",
      devices: ["/dev/sgx_enclave", "/dev/sgx_provision"],
      expose: [8000],
      ports: [`${specCfg.publicPort}:19999`],
      environment: [
        "RUST_LOG=debug,h2=info,hyper=info,reqwest=info,tower=info",
        "RUST_BACKTRACE=full",
        `EXTRA_OPTS=--role=${specCfg.role} `,
        `RA_METHOD=${specCfg.raType}`
      ],
      networks: ["ceseal"],
      volumes: [`${cesealHomePath}/data:/opt/ceseal/data`, `${cesealHomePath}/backups:/opt/ceseal/backups`],
      logging: {
        driver: "json-file",
        options: {
          "max-size": "300m",
          "max-file": "10",
        },
      },
    },
    {
      image: `cesslab/cifrost:${imageTagByProfile(
        config.node.profile
      )}`,
      container_name: cifrostHostname,
      hostname: cifrostHostname,
      restart: "always",
      command: cesealCmds,
      environment: ["RUST_LOG=debug,h2=info,hyper=info,reqwest=info,tower=info", "RUST_BACKTRACE=full"],
      networks: ["ceseal"],
      extra_hosts: ["host.docker.internal:host-gateway"],
      depends_on: {
        ceseal: {
          condition: "service_healthy"
        },
        chain: {
          condition: "service_healthy"
        }
      },
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
  genCesealComposeConfigs: genCesealComposeConfigs,
};
