"use strict"

const Endpoint = require("../../../endpoint")

module.exports = new Endpoint({
  name: {
    required: true,
    type: "string"
  },
  age: {
    required: true,
    type: "number",
  },
  test: {
    model: "test2"
  }
})
