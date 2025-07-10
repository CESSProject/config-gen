const Joi = require('joi')

const cacherSchema = Joi.object({
  enable: Joi.boolean().required().default(false),
  WorkSpace: Joi.string().required().default("/mnt/cess_cacher"),
  CacheSize: Joi.number().integer().required().default(17179869184),
  Rpcs: Joi.array().required().default(["ws://127.0.0.1:9944", "wss//testnet-rpc.cess.network"]),
  SecretKey: Joi.string().optional().allow(""),
  Token: Joi.string().optional().allow(""),
  TokenAcc: Joi.string().optional().allow(""),
  TokenAccSign: Joi.string().optional().allow(""),
  ProtoContract: Joi.string().required().default("0xce078A9098dF68189Cbe7A42FC629A4bDCe7dDD4"),
  MinerConfigPath: Joi.string().required().default("/opt/cess/mineradmConf.yaml"),
  CdnNodes: Joi.array().items(
    Joi.object({
      Account: Joi.string().optional().default("0xb7B43408864aEa0449D8F813380f8ec424F7a775"),
      Endpoint: Joi.string().optional().default("https://retriever.cess.network"),
    })).min(1).required(),
  StorageNodes: Joi.array().items(
    Joi.object({
      Account: Joi.string().optional().allow("").default(""),
      Endpoint: Joi.string().optional().allow("").default(""),
    })).min(0).optional(),
})

module.exports = {
  cacherSchema,
}
