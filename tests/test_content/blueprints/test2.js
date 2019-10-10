"use strict"

module.exports = {
  attributes: {
    name: {
      required: true,
      type: "string"
    },
    age: {
      required: true,
      type: "number",
    },
    test: {
      model: "test"
    }
  }
}
