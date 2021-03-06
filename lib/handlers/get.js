"use strict"

const utils = require("../utils")
const Http_Error = require("../http-error")

function findRelatedModelIDByCriteria(model, criteria, viaColumn) {
  const via = viaColumn || "id"

  return model.find({
    select: [via],
    where: criteria
  })
    .then(results => results.map(result => result[via]))
}

/**
 * Get all the ids for the {target} model
 * based on a subquery.
 *
 * @param { Waterline.Collection[] } models to query against.
 * @param { { tableName: string, collection: Waterline.Collection, columns: string[], tables: string[] } } junctionTable to get intermediary IDs from.
 * @param { Object } subQueryCriteria object to query the related table with.
 * @return { Promise<Object[]> } unresolved promise with the result sets.
 */
function findRelatedCollectionIDsByCriteria(models, junctionTable, subQueryCriteria) {
  const subQueryTable = models[junctionTable.tables[1]]

  return subQueryTable
    .find({
      select: ["id"],
      where: subQueryCriteria
    })
    .then(idObjects => idObjects.map(idObject => idObject.id))
    .then(ids => {
      const junctionTableQuery = {}

      junctionTableQuery[junctionTable.columns[0]] = ids

      return junctionTable.collection.find({
        select: [junctionTable.columns[1]],
        where: junctionTableQuery
      })
        .then(idObjects => idObjects.map(idObject => idObject[junctionTable.columns[1]]))
    })
}

/**
 * Get the junction table waterline generates for
 * many-to-many related tables.
 *
 * @param { Waterline.Collection } model to get schemas from
 * @param { string } parentTableName to check relationships
 * @param { string } relatedColumnTableName to check relationships
 * @return { Waterline.Collection | false } The junction table or undefined.
 */
function getJunctionTableFromModelAndRelatedColumn(model, parentTableName, relatedColumnTableName) {
  const junctionTableName = Object.keys(model.waterline.schema)
    .find(schemaName => {
      const tables = model.waterline.schema[schemaName].tables

      if (!tables) return false

      return tables[0] === parentTableName && tables[1] === relatedColumnTableName
    })

  if (!junctionTableName) return false

  const junctionTableSchema = model.waterline.schema[junctionTableName]
  const junctionTableCollection = model.waterline.collections[junctionTableName]

  return {
    tableName: junctionTableName,
    tables: junctionTableSchema.tables,
    collection: junctionTableCollection,
    columns: Object.keys(junctionTableCollection.attributes).filter(name => name !== "id")
  }
}

module.exports = function GETHandler(model, request, callback, from_post) {
  // How many results per page do we want?
  const settings = model.multicolour_instance.get("config").get("settings")
  const per_page = request.url.searchParams.perPage || (settings.results || {}).per_page || 10

  // Get which page we're on
  const page = Number(request.url.searchParams.page) - 1 || 0
  
  // No sorting by default.
  const sorting = (request.url.searchParams.sortBy || "")
    .split(",")
    .filter(Boolean)
    .map(column_order => column_order.split(":"))
    .reduce((sortable, current) => {
      sortable.push({
        [current[0]]: current[1],
      })
      return sortable
    }, [])

  delete request.url.searchParams.sortBy

  if (model.attributes.updatedAt)
    sorting.push({updatedAt: "DESC"})

  // Get the query string.
  const qs = Object.keys(request.url.searchParams)
    .reduce((qs, currentKey) => {
      if (model.attributes.hasOwnProperty(currentKey))
        qs[currentKey] = request.url.searchParams[currentKey]

      return qs
    }, {})

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

  // If we're passed an id in the params, then just add to our
  // query object.
  if (request.params.id)
    qs.id = request.params.id

  // Compile constraints if there are any.
  if (!from_post && model.constraints && model.constraints.get) {
    let constraints
    try {
      constraints = utils.compile_constraints(request, model.constraints.get)
    } catch (error) {
      console.error(error) // eslint-disable-line no-console
      return callback(error, null, model)
    }

    // Extend the constraints onto the query.
    Object.assign(qs, constraints)
  }

  // If there are no associations to populate, exit early
  // with the query results.
  if (payload_associations.length === 0 || Object.keys(populate_where).length === 0) {
    const query = model.find(qs).populateAll()

    // Paginate.
    if (typeof per_page !== "undefined" && per_page > 0)
      query
        .skip(Math.abs(page * per_page))
        .limit(per_page)

    // Add any sorting we wanted.
    if (sorting)
      query.sort(sorting)

    return query
      .then(rows => callback(null, rows, model))
      .catch(err => callback(err, null, model))
  }


  // Run all the sub-queries required to complete this query.
  const tasks = Object.keys(populate_where).map(relationship => {
    const collections = model.waterline.collections
    const column = model.attributes[relationship]
    const via = column.via || "id"
    const target = collections[column.collection || column.model]
    const junctionTable = getJunctionTableFromModelAndRelatedColumn(
      target, 
      model.adapter.identity, 
      target.adapter.identity
    )

    if (column.collection && junctionTable)
      return findRelatedCollectionIDsByCriteria(collections, junctionTable, populate_where[relationship])
        .then(results => ({
          relationship: relationship,
          ids: results,
          targetColumn: via,
          relationshipType: "collection",
        }))

    if (column.model)
      return findRelatedModelIDByCriteria(collections[column.model], populate_where[relationship], column.via)
        .then(results => ({
          relationship: relationship,
          ids: results,
          relationshipType: "model"
        }))

    populate_where[relationship].select = [via]

    return target
      .find(populate_where[relationship])
      .then(ids => ({
        relationship,
        ids: ids.map(res => res[via])
      }))
  })

  Promise.all(tasks)
    .then(results => {
      const queryWhere = results.reduce((out, currentWhere) => {
        if (currentWhere.relationshipType === "collection") {
          if (!out[currentWhere.targetColumn]) 
            out[currentWhere.targetColumn] = []
          
          out[currentWhere.targetColumn] = out[currentWhere.targetColumn].concat(currentWhere.ids)
        }
        else          
          out[currentWhere.relationship] = currentWhere.ids

        return out
      }, qs)

      const query = model
        .find(queryWhere)
        .populateAll()
          
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
