"use strict"

const utils = require("../utils")

module.exports = function PATCHHandler(model, request, callback) {
  // Start with the id.
  const qs = {id: request.params.id}
  const payload = Object.assign({}, request.payload, qs)

  // Compile constraints if there are any.
  if (model.constraints && model.constraints.patch) {
    const constraints = utils.compile_constraints(request, model.constraints.patch)

    // Extend the constraints onto the query.
    Object.assign(qs, constraints)
    Object.assign(payload, constraints)
  }

  model.update(qs, payload, err => {
    if (err) {
      /* istanbul ignore next: Untestable */
      callback(err, null, model)
    }
    else {
      this.GET(model, request, callback)
    }
  })
}

