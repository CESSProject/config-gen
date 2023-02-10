const Joi = require('joi')

const chainSchema = Joi.object({
  name: Joi.string().required(),
  chainSpec: Joi.string().optional(),
  port: Joi.number().port().default(30336),
  pruning: Joi.any().default(8000),
  extraCmdArgs: Joi.string(),
})

module.exports = {
  chainSchema,
}
