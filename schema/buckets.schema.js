const Joi = require('joi')
const {bucketSchema} = require('./bucket.schema')

const bucketsSchema = Joi.array().items(bucketSchema).required();

module.exports = {
  bucketsSchema,
}
