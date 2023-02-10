const Joi = require('joi')

const schedulerSchema = Joi.object({
  stashAccount: Joi.string().required(),
  controllerPhrase: Joi.string().required(),
  port: Joi.number().port().default(15000),
  sgxPort: Joi.number().port().default(8080),
  extraCmdArgs: Joi.string(),
})

module.exports = {
  schedulerSchema,
}
