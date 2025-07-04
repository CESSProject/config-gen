const { imageTagByProfile, chainHostName } = require("../utils");

const cesealHomePath = "/opt/cess/tee/ceseal";

async function genCesealConfig(config) {
  const cfg = config.ceseal;
  const raw_cfg = {
    endpoint: cfg.endpointOnChain,
    mnemonic: cfg.mnemonic,
    stash_account: cfg.stash_account,
    attestation_provider: cfg.attestation_provider,
    role: cfg.role,
  };
  return {
    config: raw_cfg,
    paths: [{
      required: true,
      path: cesealHomePath,
    }],
  }
}

async function genCesealComposeConfigs(config, _) {
  const specCfg = config.ceseal;
  const cesealHostname = "ceseal";
  let cesealCmds = [
    "--config", '/data/storage_files/config.toml',
    "--listening-port", `${specCfg.publicPort}`,
  ];

  return [
    {
      image: `cesslab/ceseal:${imageTagByProfile(config.node.profile)}`,
      container_name: cesealHostname,
      hostname: cesealHostname,
      restart: "always",
      devices: ["/dev/sgx_enclave", "/dev/sgx_provision"],
      expose: [19999],
      ports: [`${specCfg.publicPort}:19999`],
      environment: [
        "RUST_LOG=info",
        "RUST_BACKTRACE=full",
        `EXTRA_OPTS=${cesealCmds.join(" ")}`,
      ],
      networks: ["ceseal"],
      volumes: [
        `${cesealHomePath}/config.toml:/opt/ceseal/releases/current/data/storage_files/config.toml`,
        `${cesealHomePath}/data:/opt/ceseal/data`,
        `${cesealHomePath}/backups:/opt/ceseal/backups`
      ],
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

module.exports = {
  genCesealConfig,
  genCesealComposeConfigs,
};
