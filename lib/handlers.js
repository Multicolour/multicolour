"use strict"

// Get some tools.
const Http_Error = require("./http-error")
const Constraints = require("./constraints")
const utils = require("./utils")

class Multicolour_Route_Templates {

  register(multicolour) {
    this.multicolour = multicolour

    multicolour.set("handlers", this)
  }

  /**
   * Return a boolean pertaining to whether this
   * collection has any associations or not.
   * @param  {Waterline.Collection} collection to check.
   * @return {Boolean} Whether or not this collection has any associations.
   */
  collection_has_associations(collection) {
    return utils.get_related_columns(collection).length > 0
  }

  /**
   * Compile any constraints and return an object.
   * @param  {Hapi.Request} request to the server.
   * @param  {Waterline.Collection} collection to get constraints from.
   * @return {Object} compiled constraints.
   */
  compile_constraints(request, constraints) {
    // Exit if there aren't any constraints.
    if (!constraints) {
      return {}
    }

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
  create_related_in_payload(request, model) {
    const payload_related = Object.keys(model.attributes)
      .filter(key => request.payload.hasOwnProperty(key))

      // Get the related models that are present in the payload.
    const related_models = payload_related
      .filter(key => model.attributes[key].collection || model.attributes[key].model)
      .reduce((out, related_key) => {
        const target = model.attributes[related_key].collection || model.attributes[related_key].model
        out[target] = model.waterline.collections[target]
        return out
      }, {})

      // Find or create each related thing.
    return Promise.all(Object.keys(related_models).map(model_name => {
      const target_model = related_models[model_name]

      // Get the payload.
      const payload = request.payload[model_name]

      // Do the work.
      return target_model.findOrCreate(payload, payload)
        .then(result => ({
          key: model_name,
          value: result[model.primaryKey]
        }))
    }))
  }

  /**
   * Posted data implies asset creation.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  POST(model, request, callback) {
    // Start with the id.
    const body = request.payload

    // Constraints on POST are pre-database checks
    // against the request.
    if (model.constraints && model.constraints.post) {
      const constraints = this.compile_constraints(request, model.constraints.post)

      // Check our constraints.
      if (!Object.keys(constraints).every(key => request[key] !== constraints[key])) {
        return callback(new Http_Error("Constraints validation failed", 412), null, this)
      }
      else {
        Object.assign(body, constraints)
      }
    }

    this.create_related_in_payload(request, model)
      .catch(err => callback(err, null, model))
      .then(results => {
        const related = {}

        // Compile the results.
        results.forEach(result => {
          related[result.key] = result.value
        })

        // Get the values to write.
        return Object.assign({}, body, related)
      })
      .then(creatable => {
        // Do the database work.
        model.create(creatable, (err, models) => {
          if (err) {
            /* istanbul ignore next: Untestable */
            return callback(err, null, model)
          }
          else {
            // Add the id to the params.
            request.params.id = models.id

            // Then pass that to the get function for the reply.
            // Pass the from_post flag so we don't run constraints
            // while we return what we just created.
            return this.GET(model, request, callback, true)
          }
        })
      })
  }

  /**
   * Get an asset.
   *
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  GET(model, request, callback, from_post) {
    // Get the query string.
    const qs = request.url.query

    // We need to where some of the populates.
    const populate_where = {}

    // Does this collection have associations?
    const payload_associations = utils.get_related_in_payload(model, qs)

    // If there are associated keys in the payload,
    // we need to do a special type of query.
    if (payload_associations.length > 0) {
      payload_associations.forEach(relationship => {
        populate_where[relationship] = qs[relationship]
        delete qs[relationship]
      })
    }

    // No sorting by default.
    let sorting = {}

    // Add sort support to the core handlers.
    if (qs.sortBy) {
      qs.sortBy
        .split(",")
        .map(column_order => column_order.split(":"))
        .forEach(parts => {
          const column = parts[0]
          const order = parts[1]

          sorting[column] = order
        })
      delete qs.sortBy
    }
    else if (model.attributes.updatedAt) {
      sorting.updatedAt = "DESC"
    }

    // How many results per page do we want?
    const per_page = this.multicolour.get("config").get("settings").results.per_page

    // Get which page we're on and remove the meta from the query.
    const page = Number(qs.page) - 1 || 0
    delete qs.page

    // Unless we"re passed an id, then find that one.
    if (request.params.id)
      qs.id = request.params.id

    // Compile constraints if there are any.
    if (!from_post && model.constraints && model.constraints.get) {
      let constraints
      try {
        constraints = this.compile_constraints(request, model.constraints.get)
      } catch (error) {
        /* eslint-disable */
        console.error(error)
        /* eslint-enable */
        return callback(error, null, model)
      }

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Start building our query.
    const query = model.find(qs)

    // Paginate.
    if (typeof per_page !== "undefined" && per_page > 0) {
      query
        .skip(Math.abs(page * per_page))
        .limit(per_page)
    }

    // Add any sorting we wanted.
    if (sorting)
      query.sort(sorting)

    const exec_callback = (err, models) => {
      // Check for errors.
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      // If we had an id but nothing was found, 404.
      else if (qs.id && models.length === 0) {
        callback(new Http_Error("Document(s) not found.", 404), null, model)
      }
      // Reply with the models.
      else {
        callback(null, models.map(model => model.toJSON()), model)
      }
    }

    // Populate any joins that might exist.
    if (this.collection_has_associations(model)) {
      let tasks = []

      // If there's no sub query to run. Just populate all.
      if (Object.keys(populate_where).length === 0) {
        query
          .populateAll({limit: per_page})
          .exec(exec_callback)
      }
      // Otherwise, populate what's been asked for.
      else {
        tasks = Object.keys(populate_where).map(relationship => {
          const collections = model.waterline.collections
          const column = model.attributes[relationship]
          const target = collections[column.collection || column.model]

          populate_where[relationship].select = [column.via || "id"]

          return target
            .find(populate_where[relationship])
            .then(ids => ({
              relationship,
              ids: ids.map(res => res[column.via || "id"])
            }))
        })

        Promise.all(tasks)
          .then(results => {
            const where_columns = {}

            results.forEach(where => {
              where_columns[where.relationship] = where.ids
            })

            query.where(where_columns)
          })
          .then(() => {
            query.exec(exec_callback)
          })
          .catch(err => callback(err, null, model))
      }
    }
    else {
      // Execute the query.
      query.exec(exec_callback)
    }
  }

  /**
   * Patch data implies asset update.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  PATCH(model, request, callback) {
    // Start with the id.
    const qs = {id: request.params.id}

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.patch) {
      const constraints = this.compile_constraints(request, model.constraints.patch)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    model.update(qs, request.payload, err => {
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      else {
        this.GET(model, request, callback)
      }
    })
  }

  /**
   * Put data implies asset replacement.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  PUT(model, request, callback) {
    // Start with anything in the query string.
    const qs = Object.assign({}, request.url.query, request.payload)

    // Remove "related" keys from the payload
    // since they're not actually "columns"
    // on the table for some reason...
    Object.keys(model.attributes)
      .filter(key => request.payload.hasOwnProperty(key))
      .filter(key => model.attributes[key].collection || model.attributes[key].model)
      .forEach(key => {
        delete qs[key]
      })

    // Did the request specify an id?
    if (request.params.id)
      qs.id = request.params.id

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.put) {
      const constraints = this.compile_constraints(request, model.constraints.put)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Try to find the top level object first.
    model.findOne(qs, (err, models) => {
      if (err)
        return callback(err, null, this)

      if (!models) {
        // If we got an id, add it to the payload.
        if (request.params.id)
          request.payload.id = request.params.id

        // Create any related models in the payload.
        return this.create_related_in_payload(request, model)
          .catch(err => callback(err, null, model))
          .then(results => {
            const related = {}

            // Compile the results.
            results.forEach(result => {
              related[result.key] = result.value
            })

            // Get the values to write.
            const values = Object.assign({}, request.payload, related)

            // Create the models.
            model.create(values, (err, models) => {
              if (err) return callback(err, null, model)

              // Add the id to the params.
              request.params.id = models.id

              // Then pass that to the get function for the reply.
              this.GET(model, request, callback)
            })
          })
      }
      else {
        return this.create_related_in_payload(request, model)
          .catch(err => callback(err, null, model))
          .then(results => {
            const related = {}

            // Compile the results.
            results.forEach(result => {
              related[result.key] = result.value
            })

            const query = Object.assign({}, models.toJSON())
            delete query.createdAt
            delete query.updatedAt

            // Get the values to write.
            const values = Object.assign({}, request.payload, related)

            return model.update(query, values, err => {
              if (err)
                return callback(err, null, this)

              // Otherwise, return the model.
              request.params.id = models.id

              this.GET(model, request, callback)
            })
          })
      }
    })
  }

  /**
   * Delete implies permanent asset destruction.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  DELETE(model, request, callback) {
    // Start with the id.
    const qs = Object.assign({id: request.params.id}, request.url.query)

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.delete) {
      const constraints = this.compile_constraints(request, model.constraints.delete)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Do the database work.
    model.find(qs, (err, models) => {
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      else if (models.length === 0) {
        callback(new Http_Error("Document(s) not found.", 404), null, model)
      }
      else {
        model.destroy(qs, err => {
          if (err) {
            /* istanbul ignore next: Untestable */
            callback(err, null, model)
          }
          else {
            callback(null, models.map(model => model.toJSON()), model)
          }
        })
      }
    })
  }

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  UPLOAD(model, request, callback) {
    // Start with the id.
    const qs = {id: request.params.id}

    // Compile constraints if there are any.
    if (model.constraints && model.constraints.post) {
      const constraints = this.compile_constraints(request, model.constraints.post)

      // Extend the constraints onto the query.
      Object.assign(qs, constraints)
    }

    // Get the key we'll use to store the location.
    let key = model.can_upload_file

    // If it was just a boolean, use a default key.
    if (typeof model.can_upload_file === "boolean") {
      key = "file"
    }

    // Find the media data.
    model.findOne(qs, (err, models) => {
      // Check for errors.
      if (err) {
        /* istanbul ignore next: Untestable */
        callback(err, null, model)
      }
      // Check we found models.
      else if (!models) {
        callback(
          new Http_Error(`Upload failed, could not find the host document with the id "${request.params.id}".`, 404),
          null,
          model
        )
      }
      // Upload the file.
      else {
        // Get the target extension & name.
        const uuid = this.multicolour.request("new_uuid")
        const extension = require("path").extname(request.payload.file.filename).toLowerCase()
        const name = `${this.file_path || ""}${uuid}${extension}`

        // Get storage config.
        const storage_config_keys = this.multicolour.request("storage_config_keys")
        const storage_config = {name}

        // Get any config available from the model.
        if (storage_config_keys) {
          storage_config_keys.forEach(key => {
            storage_config[key] = this[key]
          })
        }

        // Upload the file.
        this.multicolour.request("storage")
          .upload(request.payload.file.path, storage_config).stream
          /* istanbul ignore next: Untestable */
          .on("error", err => callback(err, null, model))
          .on("end", () => {
            // Get the update attributes.
            const attributes = {
              pending: false,
              [key]: name
            }

            // Update the model and reply with the updated model.
            model.update({id: models.id}, attributes, err => {
              if (err) {
                /* istanbul ignore next: Untestable */
                callback(err, null, model)
              }
              else {
                this.GET(model, request, callback, 202)
              }
            })
          })
      }
    })
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
