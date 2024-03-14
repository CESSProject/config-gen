
const Joi = require('joi')
const { nodeSchema } = require('./node.schema')
const { chainSchema } = require('./chain.schema')
const { bucketsSchema } = require('./buckets.schema')
const { bucketSchema } = require('./bucket.schema')
const { cesealSchema } = require('./ceseal.schema')
const { nginxSchema } = require('./nginx.schema')

function getConfigSchema(config) {
  let sMap = {
    node: nodeSchema.required(),
  }

  const mode = config.node.mode;
  if (mode == "authority") {
    sMap["chain"] = chainSchema.optional()
    sMap["ceseal"] = cesealSchema.required()
    sMap["nginx"] = nginxSchema.optional()
  }
  else if (mode == "storage") {
    sMap["chain"] = chainSchema.optional();
    sMap["bucket"] = bucketSchema.required();
  }
  else if (mode == "multibucket") {
    sMap["rpcnode"] = chainSchema.required();
    sMap["buckets"] = bucketsSchema.required()
  }
  else if (mode == "watcher" || mode == "rpcnode") {
    sMap["chain"] = chainSchema.required()
  }
  else {
    throw Error("invalid node mode:" + toString(mode))
  }

  return Joi.object(sMap)
}

module.exports = {
  getConfigSchema,
}
