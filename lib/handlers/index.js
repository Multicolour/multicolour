"use strict"

const debug = require("debug")

const handlers = {
  POST: require("./post"),
  GET: require("./get"),
  PATCH: require("./patch"),
  PUT: require("./put"),
  DELETE: require("./delete"),
  UPLOAD: require("./upload")
}

class Multicolour_Route_Templates {

  register(multicolour) {
    this.multicolour = multicolour

    multicolour.set("handlers", this)

    this.debug = debug("multicolour:handlers")
  }

  /**
   * Posted data implies asset creation.
   *
   * @param {Waterline.Collection} model to use
   * @param {Hapi.Request} request made.
   * @param {(Error, Array<Object>, Waterline.Collection) => void} callback to execute when finished.
   */
  POST(model, request, callback) {
    return handlers.POST(model, request, callback)
  }

  /**
   * Get an asset.
   *
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  GET(model, request, callback, from_post) {
    return handlers.GET(model, request, callback, from_post)
  }

  /**
   * Patch data implies asset update.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  PATCH(model, request, callback) {
    return handlers.PATCH(model, request, callback)
  }

  /**
   * Put data implies asset replacement.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  PUT(model, request, callback) {
    return handlers.PUT(model, request, callback)
  }

  /**
   * Delete implies permanent asset destruction.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  DELETE(model, request, callback) {
    return handlers.DELETE(model, request, callback)
  }

  /**
   * Upload handler for creating media. This function is
   * called with `.bind(Waterline.Collection)`.
   *
   * @param {Hapi.Request} request made.
   * @param {Hapi.Reply} reply interface.
   */
  UPLOAD(model, request, callback) {
    return handlers.UPLOAD(model, request, callback)
  }
}

// Export the templates.
module.exports = Multicolour_Route_Templates
