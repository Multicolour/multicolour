"use strict"

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    name: {
      required: true,
      type: "string",
      metadata: {
        notes: "Notes on the name of a test thing.",
        description: "The name is a short string that colloqually identifies a thing from other things."
      }
    },
    test: {
      type: "string",
      defaultsTo: "multicolour"
    },
    age: {
      required: true,
      type: "integer",
      min: 0,
      max: 9000 // OVER 9000!???!!!
    },
    empty: "string",
    order: "order",

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
