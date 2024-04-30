const Joi = require('joi')
const {minerSchema} = require('./miner.schema')

const minersSchema = Joi.array().items(minerSchema).required();

module.exports = {
  minersSchema,
}
