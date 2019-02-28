"use strict"

/**
 * Generate a secure string using the Diffie Hellman algorithm.
 *
 * @link https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange
 * @param  {Number} prime_length to generate to.
 * @return {String} salt to use to secure a password.
 */
const create_salt = () => require("crypto")
  .createDiffieHellman(process.env.SALT_GEN_PRIME_LENGTH || 400, "base64")
  .generateKeys("base64")

/**
 * Hash a plain string with the salt and call the callback.
 * @param  {String}   plain_text to hash.
 * @param  {String}   salt to use during hash process.
 * @param  {Function} callback to execute with the new password.
 * @return {void}
 */
function hash_password(plain_text, salt, callback) {
  // Get the crypto library.
  const crypto = require("crypto")

  // These should be a *slow* as possible, higher = slower.
  // Slow it down until you tweak a bounce change.
  const password_iterations = process.env.PW_GEN_PW_ITERS || 4096

  // Password length and algorithm.
  const password_length = process.env.PW_GEN_PW_LENGTH || 512
  const password_algorithm = process.env.PW_GEN_PW_ALG || "sha256"

  // Create a hash, we're going to encrypt the password.
  // I wish Node had native support for good KDF functions
  // like bcrypt or scrypt but PBKDF2 is good for now.
  crypto.pbkdf2(plain_text, salt, password_iterations, password_length, password_algorithm, (err, key) => {
    // Move on.
    callback(key.toString("hex"), salt)
  })
}

/**
 * Remove any null or undefined values from
 * an object and return it.
 * @param  {Object} object to remove empties from.
 * @return {Object} object without empties.
 */
function remove_null_undefined(object) {
  Object.keys(object).forEach(key => {
    if (object[key] === null || typeof object[key] === "undefined") {
      delete object[key]
    }
  })

  return object
}

/**
 * Get related column names from a collection.
 * Does not include foreign key declarations.
 *
 * @param  {Waterline.Collection} collection to get related attributes of.
 * @return {Array<string>} array of related attribute names.
 */
function get_related_columns(collection) {
  return Object.keys(collection.attributes)
    .filter(attribute => collection.attributes[attribute].collection || collection.attributes[attribute].model)
}

/**
 * Get the(any) related key names in the payload.
 *
 * @param  {Waterline.Collection} collection to get related attributes in.
 * @param  {Object} payload to get related keys from.
 * @return {Array<string>} Array of related attributes in the payload.
 */
function get_related_in_payload(collection, payload) {
  // If there's nothing to filter, just exit with nothing.
  if (!payload) return []

  // Get the keys that are associations in the collection.
  const related_in_collection = new Set(get_related_columns(collection))

  // Filter the payload based on the collection's associations.
  return Object.keys(payload).filter(key => related_in_collection.has(key))
}
  
/**
   * Compile any constraints and return an object.
   * @param  {Hapi.Request} request to the server.
   * @param  {Waterline.Collection} collection to get constraints from.
   * @return {Object} compiled constraints.
   */
function compile_constraints(request, constraints) {
  const Constraints = require("./constraints")
  
  // Exit if there aren't any constraints.
  if (!constraints)
    return {}

  return new Constraints()
    .set_source(request)
    .set_rules(constraints)
    .compile()
    .results
}

/**
 * Private function to create related models
 * that appear in the payload to work around
 * a bug in Waterline #1442.
 *
 * @param {Request} request object
 * @param {Waterline.Collection} collection to base relationships on.
 * @return {Promise} promise in unresolved state.
 */
function create_related_in_payload(payload, model) {
  const debug = require("debug")("multicolour:related-payload-creation")

  const create_or_find_item = (item, target_model) => {
    return create_related_in_payload(item, target_model)
      .then(() => {
        if (typeof item === "string" || typeof item === "number")
          return target_model.findOne({id: item})
        else if (item && item.toString() === "[object Object]")
          return target_model.findOrCreate(item, item)
        else
          return Promise.reject(new Error("Not and object, string or number. Can't create or find this."))
      })
  }

  const payload_related = Object.keys(model.attributes)
    .filter(key => payload.hasOwnProperty(key))

  // Get the related models that are present in the payload.
  const related_models = payload_related
    .filter(key => model.attributes[key].collection || model.attributes[key].model)
    .reduce((out, related_key) => {
      const target = model.attributes[related_key].collection || model.attributes[related_key].model
      out[related_key] = model.waterline.collections[target]
      return out
    }, {})

  const related_models_names = Object.keys(related_models)

  debug("Finding/creating related attributes for", related_models_names)

  // Find or create each related thing.
  return Promise.all(related_models_names.map(model_name => {
    const target_model = related_models[model_name]

    // Get the payload.
    const relatedPayload = payload[model_name]

    // Do the work.
    if (Array.isArray(relatedPayload))
      return Promise.all(relatedPayload.map(item => create_or_find_item(item, target_model)))

    return create_or_find_item(relatedPayload, target_model)
      .then(result => ({
        key: model_name,
        value: result[model.primaryKey || "id"]
      }))
  }))
}

// Export the tools.
module.exports.create_related_in_payload = create_related_in_payload
module.exports.compile_constraints = compile_constraints
module.exports.create_salt = create_salt
module.exports.hash_password = hash_password
module.exports.remove_null_undefined = remove_null_undefined
module.exports.get_related_columns = get_related_columns
module.exports.get_related_in_payload = get_related_in_payload
