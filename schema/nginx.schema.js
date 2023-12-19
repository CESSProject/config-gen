const Joi = require("joi");

const nginxSchema = Joi.object({
    confPath: Joi.string().required(),
    logPath: Joi.string().required(),
});

module.exports = {
    nginxSchema,
};
