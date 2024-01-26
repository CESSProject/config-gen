async function genNginxComposeConfigs(config, _) {
    const ngxCfg = config.nginx;
    const nginxHostname = "nginx";
    let nginxVolumeMappings = [`${ngxCfg.confPath}:/etc/nginx/conf.d`];
    nginxVolumeMappings.push(`${ngxCfg.logPath}/log:/var/log/nginx`);

    return {
        image: `nginx:latest`,
        container_name: nginxHostname,
        hostname: nginxHostname,
        restart: "always",
        expose: [80],
        ports: [`80:80`],
        networks: ["ceseal"],
        volumes: nginxVolumeMappings,
        logging: {
            driver: "json-file",
            options: {
                "max-size": "300m",
                "max-file": "10",
            },
        },
    }
}
module.exports = {
    genNginxComposeConfigs: genNginxComposeConfigs,
};