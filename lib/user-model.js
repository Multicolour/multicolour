"use strict"

// Get out utility-belt.
const utils = require("./utils")

/**
 * Hash a plain text password using PBKDF2 and SHA256.
 * @param  {Object}   values to be written to the database.
 * @param  {Function} next callback, used to finish the operation.
 * @return {void}
 */
function hash_password(values, next) {
  // If no password was provided, just move on and exit.
  if (!values.password || values.password.length > 1000) {
    return next()
  }

  this
    .findOne(values)
    .then(user => {
      // Create a salt for this user if they don't have one.
      const salt = user && user.salt ? user.salt : utils.create_salt()

      // We're going to encrypt the password.
      utils.hash_password(values.password, salt, (password, salt) => {
        // Apply the hash and salt to the inbound values.
        values.password = password.toString("hex")
        values.salt = salt
        values.requires_password = false


        // Move on.
        next()
      })
    })
    .catch(next)
}

module.exports = {
  // Name of the table.
  identity: "multicolour_user",

  // User's details.
  attributes: {
    username: {
      type: "string",
      required: true,
      unique: true
    },
    email: {
      type: "string",
      email: true,
      unique: true
    },
    name: {
      required: true,
      type: "string"
    },
    role: {
      type: "string",
      defaultsTo: "user",
      enum: ["user", "admin", "consumer", "inactive"]
    },
    salt: "string",
    password: "string",
    source: "string",
    profile_image_url: {
      type: "string",
      url: true
    },
    requires_password: {
      type: "boolean",
      defaultsTo: true,
    },
    requires_email: {
      type: "boolean",
      defaultsTo: true,
    },

    /**
     * When returning a user from the database,
     * we don't want the password to be exposed.
     * @return {Object} modified user object.
     */
    toJSON: function toJSON() {
      const model = this.toObject()
      delete model.password
      delete model.salt

      // Return the modified user object.
      return utils.remove_null_undefined(model)
    }
  },

  // Don't do anything automatic for the core user blueprint.
  NO_AUTO_GEN_ROUTES: true,
  NO_AUTO_GEN_FRONTEND: true,

  // Before we create anything, make sure
  // to hash the password for security.
  beforeCreate: hash_password,
  beforeUpdate: hash_password
}
