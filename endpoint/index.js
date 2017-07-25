"use strict"

const endpoint_builtins = new Set([
  "constructor",
  "$_endpoint_class",
  "builtins",
  "POST",
  "GET",
  "PATCH",
  "PUT",
  "DELETE",
  "FE_POST",
  "FE_GET",
  "FE_PATCH",
  "FE_DELETE",
  "rawify",
  "add_create_route",
  "add_read_route",
  "add_update_route",
  "add_update_or_create_route",
  "add_delete_route",
  "add_create_frontend",
  "add_read_frontend",
  "add_update_frontend",
  "add_delete_frontend"
])

/**
* The difference between using Endpoint
* and just specifying the JSON is the JSON
* implicitely generates all the things and
* the Endpoint class explicitely generates
* only what you tell it to. Everything = false by default.
*/
class Endpoint {
  /**
   * Create a model where none of the endpoints
   * are created by default and must be explicitely
   * added in the definition.
   *
   * @param {Object} blueprint to define this model.
   * @return {void}
   */
  constructor(blueprint) {
    // Check we got the basics we need.
    if (!blueprint || Object.keys(blueprint).length === 0) {
      throw new TypeError("Must pass a blueprint into an Endpoint.")
    }

    // Make this "thing" identifiable compared to
    // pure JSON definitions.
    this.$_endpoint_class = true

    // Add the blueprint to this endpoint.
    this.attributes = Object.assign({}, blueprint)

    // API.
    this.POST = false
    this.GET = false
    this.PATCH = false
    this.PUT = false
    this.DELETE = false

    // Frontend.
    this.FE_POST = false
    this.FE_GET = false
    this.FE_PATCH = false
    this.FE_DELETE = false
  }

  /**
   * Get a raw version of this Endpoint
   * so it has a similar structure to a
   * standard JSON model definition.
   * @return {Object} JSON-ified representation of this Endpoint.
   */
  rawify() {
    const as_json = Object.assign({}, this)

    endpoint_builtins.forEach(builtin => delete as_json[builtin])

    return as_json
  }

  add_create_route() {
    this.POST = true
    return this
  }

  add_read_route() {
    this.GET = true
    return this
  }

  add_update_route() {
    this.PATCH = true
    return this
  }

  add_update_or_create_route() {
    this.PUT = true
    return this
  }

  add_delete_route() {
    this.DELETE = true
    return this
  }

  add_create_frontend() {
    this.FE_POST = true
    return this
  }

  add_read_frontend() {
    this.FE_GET = true
    return this
  }

  add_update_frontend() {
    this.FE_PATCH = true
    return this
  }

  add_delete_frontend() {
    this.FE_DELETE = true
    return this
  }
}

module.exports = Endpoint
