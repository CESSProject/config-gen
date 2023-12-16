const Joi = require('joi')

const bucketSchema = Joi.object({
  incomeAccount: Joi.string().required(),
  signPhrase: Joi.string().required(),
  port: Joi.number().port().default(15001),
  diskPath: Joi.string().required(),
  space: Joi.number().port().default(300),
  bootAddr: Joi.string().optional(),
  useCpuCores: Joi.number().default(0),
  extraCmdArgs: Joi.string(),
  stakerAccount: Joi.string().optional(),
  reservedTws: Joi.array().optional()
})

module.exports = {
  bucketSchema,
}
