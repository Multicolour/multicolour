"use strict"

// Get the tools.
const path = require("path")
const Waterline = require("waterline")
const waterline_joi = require("waterline-joi")
const debug = require("debug")
const get_related_columns = require("./utils").get_related_columns

class Multicolour_Waterline_Generator extends Map {
  /**
   * Instantiated by Multicolour to create database models.
   * @return {Multicolour_Waterline_Generator} Multicolour_Waterline_Generator for chaining.
   */
  constructor() {
    // Construct.
    super()

    // Attach a debugger.
    this.debug = debug("multicolour:database")

    // Set some properties.
    this
      .set("database_connected", false)
      .set("waterline", new Waterline())
      .set("definitions", {})

    this.pre_start_models_override = (modelsDefinitions) => modelsDefinitions

    // Generate the schemas.
    this.request("host").get("blueprints")
      // Resolve their location.
      .map(file_path => path.resolve(file_path))

      // Get the file and it's name.
      .map(file_path => {
        // Get the model.
        const model = require(file_path)

        // Create the format the rest of this module requires.
        return {
          name: require("pluralize")(model.identity || path.basename(file_path, ".js"), 1),
          model: model
        }
      })

      // Register the definitions.
      .map(blueprint => {
        this.get("definitions")[blueprint.name] = blueprint.model
        return blueprint
      })

    return this
  }

  /**
   * Set the property required by other mechanisms
   * on the host.
   * @param  {Multicolour} multicolour instance running this plugin.
   * @return {void}
   */
  register(multicolour) {
    multicolour.set("database", this)
  }

  /**
   * By default, we don't want any NULL
   * or undefined values in our response.
   * @return {Object} without any undefined or null values.
   */
  default_toJSON(original) {
    const utils = require("./utils")

    // Get the object.
    let model = this.toObject()

    // Call the original toJSON method on the model.
    if (original && original instanceof Function) {
      model = original.call(this)
    }

    // Return the modified object.
    return utils.remove_null_undefined(model)
  }

  /**
   * Add some custom types to the model.
   *
   * @param {Object} the model definition to add types to.
   * @return {void}
   */
  add_metadata_to_model(model) {
    if (!model.hasOwnProperty("types"))
      model.types = {
        metadata: () => true
      }
    else
      model.types.metadata = () => true

    if (!model.hasOwnProperty("_metadata"))
      model._metadata = {}

    // Move the metadata into a class method.
    Object.keys(model.attributes)
      .filter(attribute_name => model.attributes[attribute_name].hasOwnProperty("metadata"))
      .forEach(attribute_name => (model._metadata[attribute_name] = model.attributes[attribute_name].metadata))
  }

  /**
   * Generate Waterline models from the blueprint JSON.
   * @param  {Object} blueprint to generate from.
   * @return {Waterline.Collection} generated Waterline Collection.
   */
  generate_model(blueprint) {
    // If it's the Endpoint class, rawify the model.
    if (blueprint.model.$_endpoint_class && blueprint.model.rawify) {
      blueprint.model = blueprint.model.rawify()
    }

    // Default some values.
    blueprint.model.identity = blueprint.name
    blueprint.model.datastore = blueprint.model.connection || "default"
    blueprint.model.migrate = blueprint.model.migrate || (
      this.request("host").get("env") !== "production" 
        ? "alter" 
        : "safe"
    )

    // If no toJSON method exists, create a default.
    if (!blueprint.model.attributes.hasOwnProperty("toJSON")) {
      blueprint.model.attributes.toJSON = this.default_toJSON
    }
    // Otherwise, wrap the one we have to standardise behaviour.
    else {
      // Get the current value.
      const original_toJSON = blueprint.model.attributes.toJSON
      const new_toJSON = this.default_toJSON

      // Wrap it to remove null and undefined values.
      blueprint.model.attributes.toJSON = function toJSON() {
        return new_toJSON.call(this, original_toJSON)
      }
    }

    // Add validators to the model.
    const validator = waterline_joi(blueprint.model.attributes, true)
    blueprint.model.is_valid = validator.validate.bind(validator)

    // Do we already have some associations?
    if (!blueprint.model.hasOwnProperty("associations")) {
      blueprint.model.associations = []
    }

    // Check for associations while this issue
    // is still happening. https://github.com/balderdashy/waterline/issues/797
    // Loop over the attributes to find any associations.
    for (const attribute in blueprint.model.attributes) {
      // Does it have a model or collection property?
      if (blueprint.model.attributes[attribute].hasOwnProperty("model") ||
        blueprint.model.attributes[attribute].hasOwnProperty("collection")) {
        // Add our new association.
        blueprint.model.associations.push({alias: attribute})
      }
    }

    // Add multicolour as an accessible instance attribute
    // to our lifecycle callbacks so we can run other queries.
    blueprint.model.multicolour_instance = this.request("host")

    // Debugging.
    this.debug("Registering generated model %s with '%s' migrate policy", blueprint.name, blueprint.model.migrate)

    // Add the metadata type.
    this.add_metadata_to_model(blueprint.model)

    // Fix autoCreated/UpdatedAt attribute not
    // being supported in 0.13.
    if (blueprint.model.hasOwnProperty("autoCreatedAt")) {
      if (blueprint.model.autoCreatedAt) {
        blueprint.model.attributes.createdAt = {
          type: "ref",
          columnType: "datetime",
          autoCreatedAt: true,
        }
      }
      delete blueprint.model.autoCreatedAt
    }
    if (blueprint.model.hasOwnProperty("autoUpdatedAt")) {
      if (blueprint.model.autoUpdatedAt) {
        blueprint.model.attributes.updatedAt = {
          type: "ref",
          columnType: "datetime",
          autoUpdatedAt: true,
        }
      }
      delete blueprint.model.autoUpdatedAt
    }

    // Fix the toJSON in 0.11.x being an attribute 
    // and in 0.13.x being a class attribute.
    if (blueprint.model.attributes.toJSON) {
      blueprint.model.toJSON = blueprint.model.attributes.toJSON
      delete blueprint.model.attributes.toJSON
    }

    // Fix the primary key.
    if (!blueprint.model.primaryKey) {
      blueprint.model.attributes.id = {
        type: "number",
        autoMigrations: {
          autoIncrement: true,
        },
      }

      blueprint.model.primaryKey = "id"
    }

    // Fix up attributes defined of nothing but a string type.
    Object.keys(blueprint.model.attributes)
      .forEach(attributeName => {
        if (typeof blueprint.model.attributes[attributeName] === "string") {
          blueprint.model.attributes[attributeName] = {
            type: blueprint.model.attributes[attributeName]
          }
        }
      })

    // Create the collection.
    return Waterline.Collection.extend(blueprint.model)
  }

  /**
   * Register a new model by it's path from outside
   * the scanned content folder.
   *
   * @param {String} model_path to register as a model.
   * @return {Waterline.Collection} added collection.
   */
  register_new_model(model_path) {
    if (!model_path || typeof model_path !== "string") {
      throw new TypeError("model_path must be a string to register_new_model")
    }

    const model = require(require.resolve(model_path))
    const identity = require("pluralize")(model.identity || path.basename(model_path, ".js"), 1)

    this.get("definitions")[identity] = model

    // Generate the model.
    return this.generate_model({identity, model})
  }

  /**
   * Start the database connector.
   * @param  {Function} callback to pass to the underlying tech.
   * @return {void}
   */
  start() {
    
    const multicolour = this.request("host")

    // Emit an event for database starting.
    multicolour.trigger("database_starting", {collections: this.rawWaterlineModels})


    // If we're already connected, just
    // show a little warning (DEBUG mode)
    // and resolve the same.
    if (this.get("database_connected")) {
      // Show a little warning.
      this.debug("WARN: You asked me to start the database when it's already started. Not starting.")

      // Resolve the promise as if it were started.
      return Promise.resolve({
        collections: this.get("models"),
        connections: this.get("connections")
      })
    }

    // Get some helpful stuff.
    const waterline = this.get("waterline")
    const config = multicolour.get("config").get("db")
    const models_to_register = this.pre_start_models_override(this.get("definitions"))

    // Generate the models.
    Object.keys(models_to_register)
      .map(model_name => ({
        name: model_name,
        model: models_to_register[model_name]
      }))

      // Perform some updates and bug fixes for Waterline
      // before shipping to the loadCollection method.
      .map(this.generate_model.bind(this))

      // Register them with Waterline.
      .map(waterline.registerModel.bind(waterline))

    // Debugging.
    this.debug("Starting database with %s", JSON.stringify(config, null, 2))

    const updatedConfig = Object.create(null)
    updatedConfig.adapters = config.adapters
    updatedConfig.datastores = config.connections

    // Waterline 0.13.x requires a default datastore.
    // Even if we specify all of them above (we do). hey ho.
    updatedConfig.datastores.default = config.connections[multicolour.get("env") || "development"]

    // Try to start Waterline.
    return new Promise((resolve, reject) => {
      this.get("waterline").initialize(updatedConfig, (err, ontology) => {
        if (err) {
          /* istanbul ignore next: Untestable */
          return reject(err)
        }

        // These models are unrelated to one another, first pass.
        this.raw_waterline_joi_models = Object.keys(this.get("definitions"))
          .map(modelName => ({
            schema: waterline_joi(ontology.collections[modelName].attributes, false),
            identity: modelName
          }))
          .reduce((schemas, current_schema) => {
            schemas[current_schema.identity] = current_schema.schema
            return schemas
          }, {})

        this.debug("Generated Joi models for", Object.keys(this.raw_waterline_joi_models))

        // The second pass allows us to take all of the unrelated models
        // and stitch them together so payloads are all good.
        this.raw_waterline_joi_models_related = Object.keys(this.raw_waterline_joi_models)
          .map(modelName => {
            const model = ontology.collections[modelName]
            const related_columns = get_related_columns(model)
            const validation_model = Object.assign({}, this.raw_waterline_joi_models[modelName])

            related_columns.forEach(column => {
              const column_data = model.attributes[column]
              const related = this.raw_waterline_joi_models[column_data.collection || column_data.model]
              
              validation_model[column] = related
            })
            return {
              schema: validation_model,
              identity: modelName,
            }
          })
          .reduce((schemas, current_schema) => {
            schemas[current_schema.identity] = current_schema.schema
            return schemas
          }, {})

        this.debug("Generated related Joi models for", Object.keys(this.raw_waterline_joi_models_related))

        this
          .set("database_connected", true)
          .set("models", ontology.collections)
          .set("connections", ontology.datastores)

        resolve(ontology)
      })
    })
  }

  stop() {
    if (!this.get("database_connected"))
      return Promise.resolve()

    const multicolour = this.request("host")

    // Emit an event for database stopping.
    multicolour.trigger("database_stopping")

    return new Promise(resolve => {
      this.get("waterline").teardown(() => {
        this.debug("Database closed/stopped.")

        // Reset the class.
        this.set("database_connected", false)
        this.delete("models")
        this.delete("connections")

        // Emit an event for database having stopped.
        multicolour.trigger("database_stopped")

        return resolve()
      })
    })
  }
}

// Export Multicolour_Waterline_Generator for Multicolour
// to register.
module.exports = Multicolour_Waterline_Generator
