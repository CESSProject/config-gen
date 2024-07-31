const Joi = require('joi')

const minerSchema = Joi.object({
  chainWsUrl: Joi.string().optional(),
  backupChainWsUrls: Joi.array().optional(),
  port: Joi.number().port().default(15001),
  earningsAcc: Joi.string().optional(),
  incomeAccount: Joi.string().optional(),
  stakingAcc: Joi.string().optional().allow(""),
  stakerAccount: Joi.string().optional().allow(""),
  mnemonic: Joi.string().optional(),
  signPhrase: Joi.string().optional(),
  diskPath: Joi.string().required(),
  UseCpu: Joi.number().optional(),
  UseSpace: Joi.number().optional(),
  space: Joi.number().port().default(300),
  Boot: Joi.string().optional(),
  bootAddr: Joi.string().optional(),
  extraCmdArgs: Joi.string().optional(),
  reservedTws: Joi.array().optional(),
  TeeList: Joi.array().optional(),
  name: Joi.string().optional()
}).xor('Boot', 'bootAddr') // there's one item and there's only one item can be true
  .xor('mnemonic', 'signPhrase')
  .xor('earningsAcc', 'incomeAccount')

module.exports = {
  minerSchema,
}
