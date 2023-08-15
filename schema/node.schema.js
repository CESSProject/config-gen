const Joi = require('joi')

const nodeSchema = Joi.object({
  mode: Joi.string().valid('authority', 'storage', 'watcher').required(),
  externalIp: Joi.string().allow('').optional(),
  domainName: Joi.string().allow(''),
  chainWsUrl: Joi.string().required(),
  region: Joi.string().default("en"),
  profile: Joi.string().valid('devnet', 'testnet', 'mainnet').default("testnet"),
})

module.exports = {
  nodeSchema,
}