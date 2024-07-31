const Joi = require("joi");

const cesealSchema = Joi.object({
  raType: Joi.string().default("ias"),
  chainWsUrl: Joi.string().optional(),
  endpointOnChain: Joi.string().uri(),
  publicPort: Joi.number().port().default(19999),
  stashAccount: Joi.string().optional().empty(""),
  mnemonic: Joi.string().required(),
  role: Joi.string().required().insensitive().lowercase().valid("full", "marker", "verifier"),
});

module.exports = {
  cesealSchema,
};
