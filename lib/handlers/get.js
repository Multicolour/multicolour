"use strict"

const utils = require("../utils")
const Http_Error = require("../http-error")

module.exports = function GETHandler(model, request, callback, from_post) {
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
  const per_page = qs.perPage || model.multicolour_instance.get("config").get("settings").results.per_page
  delete qs.perPage

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
      constraints = utils.compile_constraints(request, model.constraints.get)
    } catch (error) {
      /* eslint-disable */
        console.error(error)
        /* eslint-enable */
      return callback(error, null, model)
    }

    // Extend the constraints onto the query.
    Object.assign(qs, constraints)
  }


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
  if (utils.get_related_columns(model).length > 0) {
    let tasks = []

    // If there's no sub query to run. Just populate all.
    if (Object.keys(populate_where).length > 0) {
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
          const queryWhere = results.reduce((out, currentWhere) => {
            out[currentWhere.relationship] = currentWhere.ids
            return out
          }, qs)
            
          const query = model.find(queryWhere)
          
          // Paginate.
          if (typeof per_page !== "undefined" && per_page > 0)
            query
              .skip(Math.abs(page * per_page))
              .limit(per_page)

          // Add any sorting we wanted.
          if (sorting)
            query.sort(sorting)

          return query
        })
        .then(rows => callback(null, rows, model))
        .catch(err => callback(err, null, model))
    }
    else
      model
        .find(qs)
        .populateAll({
          limit: per_page,
        })
        .exec(exec_callback)
  }
  else {
    // Execute the query.
    model
      .find(qs)
      .populateAll({
        limit: per_page,
      })
      .exec(exec_callback)
  }
}
