"use strict"

// Get the tools.
const waterline_joi = require("waterline-joi")
const Joi = require("joi")
const debug = require("debug")

// Does the attribute have a model or collection property?
const attribute_is_related = attribute => attribute.hasOwnProperty("model") || attribute.hasOwnProperty("collection")

// Does a model have any relationships at all?
const model_has_relationships = model => {
  if (!model)
    throw new ReferenceError(model, "No model to check attibutes on")

  if (!model.attributes)
    throw new ReferenceError("There are no attributes on this model...")

  return Object.keys(model.attributes).map(attribute => attribute_is_related(model.attributes[attribute])).length > 0
}


class Multicolour_Default_Validation {

  constructor() {
    this.debug = debug("multicolour:validators")
    this.schemas = {
      post: {},
      get: {},
      put: {},
      patch: {},
      delete: {}
    }

    this.error_schema = {
      code: Joi.number(),
      error: Joi.string(),
      message: Joi.string()
    }
  }

  /**
   * Get the schema for write operations, we have to make two passes.
   * The first pass generates the payloads for each defined model
   * and the second applies any related models payloads.
   *
   * @param  {Waterline.Collection} collection to get payload for.
   * @return {Joi.Schema} Schema for any requests.
   */
  generate_schemas(verb) {
    // Get the model definitions.
    const collections = this.multicolour.get("database").get("definitions")

    // First pass, create basic payloads.
    Object.keys(collections).forEach(collection_name => {
      const attributes = {...collections[collection_name].attributes}

      if (verb === "post")
        delete attributes.id

      this.schemas[verb][collection_name] = Object.keys(attributes).reduce((schema, currentAttributeName) => {
        const attribute = attributes[currentAttributeName]
        const type = attribute.type || attribute || "any"

        if (attribute_is_related(attribute) || type === "json" || type === "ref")
          if (type === "ref")
            switch (attribute.columnType) {
            case "date":
            case "datetime":
                schema[currentAttributeName] = Joi.date()
            }
          else
          schema[currentAttributeName] = Joi.object()
        else
          schema[currentAttributeName] = Joi[type]()

        if (attribute.required)
          schema[currentAttributeName].required()
        else
          schema[currentAttributeName].optional()

        return schema
      }, {})

      // If it's an update endpoint, make all fields optional.
      if (verb === "put" || verb === "patch") {
        Object.keys(this.schemas[verb][collection_name])
          .forEach(joi_object => {
            this.schemas[verb][collection_name][joi_object] = this.schemas[verb][collection_name][joi_object].optional()
          })
      }

      // If a writable schema wasn't requested,
      // add the id and createdAt and updatedAt.
      if (verb === "get") {
        this.schemas[verb][collection_name].id = Joi.any()
        this.schemas[verb][collection_name].createdAt = Joi.any().optional()
        this.schemas[verb][collection_name].updatedAt = Joi.any().optional()
      }
    })

    // Second pass, make related payloads.
    Object.keys(collections)
      // Only get models with defined relationships.
      .filter(collection_name => model_has_relationships(collections[collection_name]))

      // Add the schema to them.
      .forEach(collection_name => {
        const attributes = {...collections[collection_name].attributes}

        Object.keys(attributes)
          // Get an array of related attributes.
          .filter(attribute => attribute_is_related(attributes[attribute]))

          // Loop over them.
          .forEach(attribute => {
            // The target collection name.
            const target = attributes[attribute].collection || attributes[attribute].model

            // The collection to modify.
            const collection = this.schemas[verb][collection_name]

            // What schema to set the validation key to.
            let set_to = this.schemas[verb][target]

            if (!set_to) {
              /* eslint-disable no-console,max-len */
              console.error("You have an error in your API, it will cause damage and prevent your service starting.")
              console.error(`We tried to create a validation payload for the model "${target}" with the verb "${verb}" but we couldn't find that model's definition.`)
              this.debug("A common cause of this issue is you tried to relate a model to the multicolour_user model without first installing an auth package.")
              this.debug("Install an auth package and try again, I.E multicolour plugin-add hapi-jwt")
              this.debug("I will now exit.")
              throw new ReferenceError(`Could not find the model "${target}" in the "${verb}" verb object.`)
              /* eslint-enable no-console,max-len */
            }

            // If it's a writable schema, add an id property.
            if (verb !== "get" && verb !== "post")
              set_to.id = Joi.alternatives().try(Joi.number(), Joi.string()).optional()

            // Add the relation.
            if (attributes[attribute].model)
              collection[attribute] = Joi.alternatives().try(Joi.object(set_to), Joi.number(), Joi.string()).allow(null)
            else if (attributes[attribute].collection)
              collection[attribute] = Joi.alternatives().try(
                Joi.array().items(Joi.object(set_to)),
                Joi.array().items(Joi.number()),
                Joi.array().items(Joi.string())
              ).optional()
          })
      })

    return this
  }

  /**
   * Register with the server properties required by this plugin.
   * @param  {Multicolour_Server_Hapi} server to register to.
   * @return {void}
   */
  register(multicolour) {
    this.multicolour = multicolour

    // Create the verbs.
    const verbs = ["post", "get", "put", "patch", "delete"]
    verbs.forEach(this.generate_schemas.bind(this))

    // Add this validator to the list.
    multicolour.get("validators").set("application/json", this)
  }
}

// Export the plugin.
module.exports = Multicolour_Default_Validation
