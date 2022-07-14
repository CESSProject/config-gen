const Joi = require('joi')

const bucketSchema = Joi.object({
  incomeAccount: Joi.string().required(),
  signPhrase: Joi.string().required(),
  port: Joi.number().port().default(15001),
  diskPath: Joi.string().required(),
  space: Joi.number().port().default(300),
  extraCmdArgs: Joi.string(),
})

module.exports = {
  bucketSchema,
}
