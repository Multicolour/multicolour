"use strict"

/**
 * This is an example blueprint, it features
 * some of the functionality you might
 * want to implement yourself, in your own API.
 *
 * Feel free to delete this file and create your
 * own blueprints.
 *
 * I hope you enjoy using
 * Multicolour to make your APIs easier, faster & more secure
 * more quickly.
 *
 * If you need any help, join the Slack channel:
 *   https://slack.getmulticolour.com/ ❤
 */

module.exports = {
  attributes: {
    name: {
      required: true,
      type: "string",
    },
    age: {
      required: true,
      type: "number",
    },
    password: {
      required: true,
      type: "string",
    },

    // This is a relationship to this
    // model, this is a typical one to one
    // relationship. If you wanted to make
    // this relationship a one to many then
    // you could change `model` below to
    // `collection`.
    parent: {
      model: "person"
    },
    salt: "string"
  },

  /**
   * An example lifecyle callback.
   *
   * This example takes the values passed in,
   * checks if it has a password present and it then
   * generates a new salt and hashes the password before
   * continueing with the write operation.
   *
   * @param  {Object} values passed in to create.
   * @param  {Function} next function in the queue to run.
   * @return {void}
   */
  beforeCreate: (values, next) => {

    // If no password was provided, just move on and exit.
    if (!values.password) {
      return next()
    }

    const utils = require("multicolour/lib/utils")

    // Create a salt for this user if they don't have one.
    const salt = values.salt || utils.create_salt()

    utils.hash_password(values.password, salt, (password, salt) => {
      // Apply the hash and salt to the inbound values.
      values.password = password.toString("hex")
      values.salt = salt

      // Move on.
      next()
    })
  },

  /**
   * We can add any custom routes we like by defining them
   * in the custom_routes function.
   *
   * There's no magic, no trade offs you simply write the code
   * you would normally write here.
   *
   * Multicolour will not modify, read or actually do anything
   * to your custom code, it's yours and yours only.
   *
   * @param  {Hapi} hapi_server running your API.
   * @param  {Multicolour} multicolour instance this REST API is running in.
   * @return {void}
   */
  custom_routes: function custom_routes(hapi_server, multicolour) {
    // Joi is an amazing validation library,
    // read me at https://github.com/hapijs/joi/blob/v10.2.2/API.md
    const Joi = require("joi")

    // Set up a simple route that counts examples.
    hapi_server.route({
      method: "GET",
      path: "/example/count",
      config: {
        // Get any auth config from core.
        auth: multicolour.get("server").request("auth_config"),

        // Add tags to appear in the /docs endpoint.
        tags: ["api", "example"],

        // Validate the params.
        validate: {
          // Get valid headers from Multicolour.
          headers: Joi.object(
            multicolour.get("server")
              .request("header_validator")
              .get()
          ).unknown(true)
        },

        // Validate the response.
        response: {
          // Get the schema from Multicolour to validate the response.
          schema: Joi.object({
            count: Joi.number().required(),
            message: Joi.string()
          })
            .meta({className: "person_count"})
            .label("person_count")
        },

        handler: (request, reply) => {
          // `this` is the current model but only with
          // a full function () definition (no fat arrows)
          // on the custom_routes file.
          this.count(request.url.query)
            .then(count => reply({
              count,
              message: "Try POST /person to increase this count result!"
            }))
        }
      }
    })
  }
}
