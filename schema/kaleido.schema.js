const Joi = require("joi");

const kaleidoSchema = Joi.object({
  kldrEndpoint: Joi.string().uri(),
  listenerPort: Joi.number().port().default(10010),
  podr2MaxThreads: Joi.number().default(8),
  stashAccount: Joi.string().required(),
  controllerPhrase: Joi.string().required(),
  workDir: Joi.string().optional(),
  allowLogCollection: Joi.boolean().optional(),
});

module.exports = {
  kaleidoSchema,
};
