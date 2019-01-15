"use strict"

const Http_Error = require("../http-error")
const utils = require("../utils")

module.exports = function DELETEHandler(model, request, callback) {
  // Start with the id.
  const qs = Object.assign({id: request.params.id}, request.url.query)

  // Compile constraints if there are any.
  if (model.constraints && model.constraints.delete) {
    const constraints = utils.compile_constraints(request, model.constraints.delete)

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
