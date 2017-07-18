"use strict"

const debug = require("debug")("multicolour:waterline-fixes")

/**
 * For some reason, Waterline messes with sequences
 * so we simply reset them here as the server stands up.
 *
 * @note immutable function.
 * @param  {Object} collections to fix sequences for.
 * @return {Promise} unresolved promise when the fixes have finished.
 */
const fix_postgres_sequences = collections => Promise.all(Object.keys(collections)
    .map(name => collections[name])
    .filter(collection => !collection.no_seq_fix)
    .map(collection => new Promise(resolve => {
      const query = `SELECT pg_catalog.setval('${collection.adapter.identity}_id_seq', max(id), true) FROM "${collection.adapter.identity}";`

      debug("Running: %s", query)

      return collection.query(query, err => {
        if (err)
          debug("Error while running waterline fixes, continueing.", err)

        resolve()
      })
    }))
  )

module.exports = [fix_postgres_sequences]
