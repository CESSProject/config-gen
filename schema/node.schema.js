const Joi = require('joi')

const nodeSchema = Joi.object({
  mode: Joi.string().valid('tee', 'storage', 'rpcnode', 'validator', 'multiminer').required(),
  region: Joi.string().default("en"),
  profile: Joi.string().valid('devnet', 'premainnet', 'testnet', 'mainnet').default("premainnet"),
  noWatchContainers: Joi.array().optional(),
  externalChain: Joi.boolean().truthy(1, 'y').falsy(0, 'n').optional().default(false),
})

module.exports = {
  nodeSchema,
}
