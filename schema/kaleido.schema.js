const Joi = require('joi')

const kaleidoSchema = Joi.object({
  port: Joi.number().port().default(8080),
  sgxDriver: Joi.string(),
  sgxDevices: Joi.array(),
  extraCmdArgs: Joi.string(),
})

module.exports = {
  kaleidoSchema,
}
