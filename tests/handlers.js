"use strict"

// Get the testing library.
const tape = require("tape")
const Async = require("async")

// Get Multicolour.
const Multicolour = require("../index")
const Http_Error = require("../lib/http-error")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

// Create an instance of multicolour.
const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js").scan()

tape("Handlers", test => {
  const DB = multicolour.get("database")

  Promise.all([
    DB.stop(),
    DB.start()
  ])
    .then(() => {
      const models = DB.get("models")
      const model = models.test
      const handlers = multicolour.get("handlers")

      /*
      const constraints = {user: "payload.user"}

      test.doesNotThrow(() => handlers.collection_has_associations(model), "Doesn't throw error while checking for associations on a collection.")
      handlers.compile_constraints({payload: {user: 1}}, constraints)
      test.deepEquals(handlers.compile_constraints({payload: {user: 1}}, constraints), {user: 1}, "Doesn't throw error while compiling constraints")
    */

      const url = {query: {}}
      const payload = {name: "test", age: 12}
      
      Async.series([
        next => handlers.POST(model, {
          payload,
          params: {},
          url
        }, (err, created) => {
          test.equal(err, null, "No error in POST handler.")
          test.equal(created.length, 1, "Returned 1 created document")
          next()
        }),
        next => handlers.POST(model, {
          payload: {
            name: "test",
            age: 20,
            test: "multicolour"
          },
          params: {},
          url
        }, (err, created) => {
          test.equal(err, null, "No error in POST handler.")
          test.equal(created.length, 1, "Returned 1 created test document")
          next()
        }),
        next => handlers.POST(models.test2, {
          payload: {
            name: "test",
            age: 20,
            test: 2
          },
          params: {},
          url
        }, (err, created) => {
          test.equal(err, null, "No error in POST handler with relationship.")
          test.equal(created.length, 1, "Returned 1 created test2 document")
          next()
        }),
        next => handlers.GET(model, {params: {}, url}, (err, rows) => {
          test.equal(err, null, "No error in empty GET handler")
          test.equal(rows.length, 1, "Returned 1 document")
          next()
        }),
        next => handlers.GET(model, {params: {id: 1}, url}, (err, rows) => {
          test.equal(err, null, "No error in GET handler with id.")
          test.equal(rows.length, 1, "Returned 1 document")
          next()
        }),
        next => handlers.GET(model, {params: {id: 999}, url}, err => {
          test.ok(err, "Expected error in GET handler with bad id.")
          test.equal(err.code, 404, "Returned a 404")
          next()
        }),
        next => handlers.GET(models.test2, {params: {}, url: {
          query: {
            sortBy: "id:ASC",
            test: {
              test: "multicolour"
            }
          }
        }}, (err, rows) => {
          test.equal(err, null, "No error in relationship query")
          test.equal(rows.length, 2, "Got results for a relationship query.")
          next()
        }),
        next => handlers.PATCH(model, {payload, params: {id: 1}, url}, err => {
          test.equal(err, null, "No error in PATCH handler with id.")
          next()
        }),
        next => handlers.DELETE(model, {params: {id: 1}, url}, err => {
          test.equal(err, null, "No error in DELETE handler with id.")
          next()
        }),
        next => handlers.DELETE(model, {params: {id: 999}, url}, err => {
          test.ok(err instanceof Http_Error, "Get an error which is a HTTP document gone status.")
          test.equal(err.code, 404, "Document not found status code.")
          next()
        }),
        next => handlers.PUT(model, {params: {id: 2}, payload, url}, err => {
          test.equal(err, null, "No error in PUT handler with id.")
          next()
        }),
        next => handlers.PUT(model, {params: {id: 2}, payload, url}, err => {
          test.equal(err, null, "No error in PUT handler with newly created record.")
          next()
        }),
        next => handlers.UPLOAD(model, {
          params: {id: 999},
          payload: {
            file: {
              filename: test_content_path + "circle.svg",
              path: test_content_path + "circle.svg"
            }
          }, url}, err => {
          test.ok(err, "Expected error in UPLOAD handler when row not found.")
          test.equal(err.code, 404, "Get a 404 for trying to upload to unknown row")
          next()
        }),
        next => handlers.UPLOAD(model, {
          params: {id: 2},
          payload: {
            file: {
              filename: test_content_path + "circle.svg",
              path: test_content_path + "circle.svg"
            }
          }, url}, err => {
          test.equal(err, null, "No error in UPLOAD handler.")
          next()
        })
      ], () => {
        DB.stop()
          .then(() => test.end())
      })
    })
    .catch(err => {
      /* eslint-disable */
      console.log(err)
      /* eslint-enable */
      test.fail(err)
      test.end()
    })
})
