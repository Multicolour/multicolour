"use strict"

const Http_Error = require("../http-error")
const utils = require("../utils")

module.exports = function POSTHandler(model, request, callback) {
  // Start with the id.
  const body = request.payload

  // Constraints on POST are pre-database checks
  // against the request.
  if (model.constraints && model.constraints.post) {
    const constraints = utils.compile_constraints(request, model.constraints.post)

    // Check our constraints.
    if (!Object.keys(constraints).every(key => request[key] !== constraints[key])) {
      return callback(new Http_Error("Constraints validation failed", 412), null, this)
    }
    else {
      Object.assign(body, constraints)
    }
  }

  utils.create_related_in_payload(body, model)
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
      return model.create(creatable, (err, models) => {
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
    .catch(err => callback(err, null, model))
}
