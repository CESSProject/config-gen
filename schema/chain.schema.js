const Joi = require('joi')

const chainSchema = Joi.object({
  name: Joi.string().required(),
  port: Joi.number().port().default(30336),
  extraCmdArgs: Joi.string(),
})

module.exports = {
  chainSchema,
}
