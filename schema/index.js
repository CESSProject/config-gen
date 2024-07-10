
const Joi = require('joi')
const { nodeSchema } = require('./node.schema')
const { chainSchema } = require('./chain.schema')
const { minersSchema } = require('./miners.schema')
const { minerSchema } = require('./miner.schema')
const { cesealSchema } = require('./ceseal.schema')
const { nginxSchema } = require('./nginx.schema')
const {watchdogSchema} = require("./watchdog.schema");

function getConfigSchema(config) {
  let sMap = {
    node: nodeSchema.required(),
  }

  const mode = config.node.mode;
  if (mode === "authority") {
    sMap["chain"] = chainSchema.optional()
    sMap["ceseal"] = cesealSchema.required()
    sMap["nginx"] = nginxSchema.optional()
  }
  else if (mode === "storage") {
    sMap["chain"] = chainSchema.optional();
    sMap["miner"] = minerSchema.required();
  }
  else if (mode === "multiminer") {
    sMap["chain"] = chainSchema.required();
    sMap["miners"] = minersSchema.required()
    sMap["watchdog"] = watchdogSchema.optional()
  }
  else if (mode === "watcher" || mode === "rpcnode") {
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
