"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index")

tape("Endpoint library", test => {

  const endpoint = new Multicolour.Endpoint({test: "string"})

  endpoint.some_function = () => 1
  endpoint.some_value = 2

  endpoint
    .add_create_route()
    .add_read_route()
    .add_update_route()
    .add_update_or_create_route()
    .add_delete_route()
    .add_create_frontend()
    .add_read_frontend()
    .add_update_frontend()
    .add_delete_frontend()

  test.throws(() => new Multicolour.Endpoint(), TypeError, "Throws when no blueprint passed to Endpoint")

  test.equals(endpoint.POST, true, "Create route function worked")
  test.equals(endpoint.GET, true, "Read route function worked")
  test.equals(endpoint.PATCH, true, "Update route function worked")
  test.equals(endpoint.DELETE, true, "Delete route function worked")
  test.equals(endpoint.PUT, true, "Update or create route function worked")

  test.equals(endpoint.FE_POST, true, "Create route function worked")
  test.equals(endpoint.FE_GET, true, "Read route function worked")
  test.equals(endpoint.FE_PATCH, true, "Update route function worked")
  test.equals(endpoint.FE_DELETE, true, "Delete route function worked")

  let as_json

  test.doesNotThrow(() => as_json = endpoint.rawify(), "Doesn't throw while getting JSON value.")

  test.ok(as_json.some_function && as_json.some_value, "Rawified Endpoint contains assigned statics.")
  test.equals(as_json.some_function(), 1, "Assigned static function is called without error and returns value.")

  test.end()
})
