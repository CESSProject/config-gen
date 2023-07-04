const Joi = require('joi')

const kaleidoSchema = Joi.object({
  rotPort: Joi.number().port().default(10010),
  kldPort: Joi.number().port().default(4001),
  stashAccount: Joi.string().required(),
  controllerPhrase: Joi.string().required(),
  bootPeerIds: Joi.string().optional(),
  bootDnsaddr: Joi.string().optional(),
  workDir: Joi.string().optional(),
})

module.exports = {
  kaleidoSchema,
}
