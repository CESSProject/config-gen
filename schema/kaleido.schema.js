const Joi = require("joi");

const kaleidoSchema = Joi.object({
  kldrEndpoint: Joi.string().uri(),
  apiPort: Joi.number().port().default(10010),
  p2pPort: Joi.number().port().default(4001),
  podr2MaxThreads: Joi.number().default(8),
  stashAccount: Joi.string().required(),
  controllerPhrase: Joi.string().required(),
  teeType: Joi.string().required(),
  workDir: Joi.string().optional(),
  allowLogCollection: Joi.boolean().optional(),
});

module.exports = {
  kaleidoSchema,
};
