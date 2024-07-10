const Joi = require('joi');

const watchdogSchema = Joi.object({
  enable: Joi.boolean().required(),
  external: Joi.boolean().required(),
  apiUrl: Joi.string().optional().allow(""),
  port: Joi.number().integer().required(),
  scrapeInterval: Joi.number().integer().required(),
  hosts: Joi.array().items(
    Joi.object({
      ip: Joi.string().ip().required(),
      port: Joi.number().port().required(),
      ca_path: Joi.string().when('ip', {
        is: Joi.string().ip({
          version: ['ipv4', 'ipv6'],
          cidr: 'optional'
        }).not('127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      cert_path: Joi.string().when('ip', {
        is: Joi.string().ip({
          version: ['ipv4', 'ipv6'],
          cidr: 'optional'
        }).not('127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      key_path: Joi.string().when('ip', {
        is: Joi.string().ip({
          version: ['ipv4', 'ipv6'],
          cidr: 'optional'
        }).not('127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
    })).min(1).required(),
  alert: Joi.object({
    enable: Joi.boolean().required(),
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
      receive_addr: Joi.array().items(Joi.string().email()).min(1).optional()
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
