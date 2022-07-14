const Joi = require('joi')

const nodeSchema = Joi.object({
  mode: Joi.string().valid('authority', 'storage', 'watcher').required(),
  externalIp: Joi.string().required(),
  domainName: Joi.string().allow(''),
  chainWsUrl: Joi.string().required(),
  region: Joi.string().default("en"),
  profile: Joi.string().default("prod"),
})

module.exports = {
  nodeSchema,
}