"use strict"

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    name: {
      required: true,
      type: "string",
    },
    test: {
      type: "string",
      defaultsTo: "multicolour"
    },
    age: {
      required: true,
      type: "number",
    },
    empty: "string",
    order: "number",

    toJSON: function toJSON() {
      return this.toObject()
    }
  },

  constraints: {
    post: {
      "test": "payload.test"
    },
    get: {},
    patch: {},
    delete: {},
    put: {}
  },

  can_upload_file: true
}
