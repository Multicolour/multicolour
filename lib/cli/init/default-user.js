"use strict"

const email = ""
const password = ""
const role = "user"

/**
 * Create a default user once the database has started,
 * this will allow consumers to get straight to development
 * after creating a token.
 */
class Default_User_Check {

  /**
   * Multicolour core calls this to register it.
   * Run a check to see if we actually want a default
   * user and if so, try to find it.
   *
   * If no user is found, create it and exit.
   *
   * @param {Object} multicolour instance registering this plugin.
   * @return {void}
   */
  register(multicolour) {
    multicolour.on("database_started", () => {
      // Exit if we don't want to create the default user.
      if (process.env.NO_DEFAULT_USER === "true") {
        multicolour.debug("Skipping creating default user.")

        return
      }

      // This model is created by the JWT auth plugin.
      // Get it so we can run queries on the table.
      const {multicolour_user} = multicolour.get("database").get("models")

      multicolour_user.findOne({email: email})
        .then(user => {
          const message = `
            The default user is ${email} : '${password}'

            You can create a new session with a POST /session (see docs)`

          if (typeof user === "undefined") {
            Promise.all([
              multicolour_user.findOrCreate({
                email: email,
                username: email,
                password: password,
                name: email,
                role: role
              })
            ])
              .then(() => {
                multicolour.debug(message)
              })
          }
          else {
            multicolour.debug(message)
          }
        })
        .catch(err => {
          multicolour.debug(`
            There was an error either finding or creating the default user in the database.

            Please either create a user manually in the database and set the environmental NO_DEFAULT_USER=true
            or restart the server to try again.
          `, err)
        })
    })
  }
}

module.exports = Default_User_Check
