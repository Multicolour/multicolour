"use strict"

const utils = require("../utils")

module.exports = function PUTHandler(model, request, callback) {
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
    const constraints = utils.compile_constraints(request, model.constraints.put)

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
      return utils.create_related_in_payload(request, model)
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
        .catch(err => callback(err, null, model))
    }
    else {
      return utils.create_related_in_payload(request, model)
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
        .catch(err => callback(err, null, model))
    }
  })
}
