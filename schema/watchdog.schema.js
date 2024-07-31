const Joi = require('joi');

const isPrivateIP = (ip) => {
  return (
    /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(ip) ||
    ip === '127.0.0.1' ||
    ip === '::1'
  );
};

const watchdogSchema = Joi.object({
  enable: Joi.boolean().required().default(false),
  external: Joi.boolean().required().default(false),
  apiUrl: Joi.string().optional().allow(""),
  port: Joi.number().integer().required().default(13081),
  scrapeInterval: Joi.number().integer().required().default(60),
  hosts: Joi.array().items(
    Joi.object({
      ip: Joi.string().ip().required(),
      port: Joi.number().port().required(),
      ca_path: Joi.string().when('ip', {
        is: Joi.string().custom((value, helpers) => {
          if (!isPrivateIP(value)) {
            return value;
          }
          return helpers.error('ip.invalid');
        }, 'custom validation for non-private IP'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      cert_path: Joi.string().when('ip', {
        is: Joi.string().custom((value, helpers) => {
          if (!isPrivateIP(value)) {
            return value;
          }
          return helpers.error('ip.invalid');
        }, 'custom validation for non-private IP'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      key_path: Joi.string().when('ip', {
        is: Joi.string().custom((value, helpers) => {
          if (!isPrivateIP(value)) {
            return value;
          }
          return helpers.error('ip.invalid');
        }, 'custom validation for non-private IP'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    })).min(1).required(),
  alert: Joi.object({
    enable: Joi.boolean().required().default(false),
    webhook: Joi.array().items(Joi.string().uri()).when('enable', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.optional()
    }),
    email: Joi.object({
      smtp_endpoint: Joi.string().optional(),
      smtp_port: Joi.number().port().optional(),
      smtp_account: Joi.string().email().optional(),
      smtp_password: Joi.string().optional(),
      receiver: Joi.array().items(Joi.string().email()).min(1).optional()
    }).when('enable', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
  }).required()
});

module.exports = {
  watchdogSchema,
}
