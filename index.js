"use strict"

// Turn objects into message busses.
const Talkie = require("@newworldcode/talkie")

// Get some bits we need to instantiate later.
const Config = require("./lib/config")
const debug = require("debug")

class multicolour extends Map {
  /**
   * A simple, static getter for the endpoint
   * library for granular, more syntactically
   * friendly endpoint and model creation.
   */
  static get Endpoint() {
    return require("./endpoint")
  }

  /**
   * Get an instantiated Flow with this instance
   * of Multicolour ready to start testing.
   */
  get Flow() {
    /* eslint-disable */
    console.info("We have temporarily disabled the flow integration testing library")
    console.info("We will re-enable in the next; non-maintenance, version of Multicolour where it will work much better than it previously did.")
    /* eslint-enable */
    return {}
  }

  /**
   * Get the handlers used internally for database work.
   * @return {Object} handlers used by core to communicate with database(s).
   */
  static get handlers() {
    return require("./lib/handlers")
  }

  /**
   * Create some internal properties and load in
   * the CLI and configuration.
   *
   * @param  {Object} config to start Multicolour with
   * @return {void}
   */
  constructor(config) {
    // Construct.
    super()

    // Add the debug module.
    this.debug = debug("multicolour:core")

    // Set raw properties on Multicolour.
    this
      // Get the CLI.
      .set("cli", require("./lib/cli"))

      // Set the configuration for this instance.
      .set("config", config instanceof Config ? config : new Config(config))

      // Set the environment we're in.
      .set("env", process.env.NODE_ENV || "production")

      // We haven't scanned yet.
      .set("has_scanned", false)

      // Whether the service is stopping.
      .set("is_stopping", false)

      // Where we store the validators.
      .set("validators", new Map())

      // A flag to turn certain helpers off.
      .set("power_user", Boolean(process.env.I_KNOW_WHAT_IM_DOING))

    // Show the config.
    this.debug("config is %s", this.get("config").toString())

    // Where is the package.
    const package_path = require("path").resolve("package.json")

    // Get the package as well, if it exists.
    /* eslint-disable */
    if (require("fs").existsSync(package_path)) {
    /* eslint-enable */
      /* istanbul ignore next: Untestable */
      this.set("package", require(package_path))
      this.set("package_path", package_path)

      // Show the package we're loading.
      this.debug("found package %s", JSON.stringify(this.get("package"), null, 2))
    }

    // Reply to requests with the right modules.
    this
      // Get the CLI.
      .reply("cli", this.get("cli"))

      // Generate a unique id.
      .reply("new_uuid", () => require("uuid").v4())

      // The default decorator is application/json.
      .reply("decorator", "application/json")

    this
      .use(require("./lib/http-server"))

    // Does the config say to add to global?
    if (this.get("config").get("make_global")) {
      /* eslint-disable */
      console.info("Adding anything to global scope is generally bad.\nPlease consider removing make_global: true from your config.")
      /* eslint-enable */
      global.multicolour = this

      this.debug("Made instance global, I.E global.multicolour")
    }
  }

  /**
   * Update the config for this instance of Multicolour
   * based on the contents of a config file.
   * @param  {String} config_location to load config from.
   * @return {multicolour} Newly created instance of Multicolour.
   */
  static new_from_config_file_path(config_location) {
    // Check we got a config location.
    if (!config_location || config_location === "")
      throw new ReferenceError("Config location should be a (string) value")

    // Create a new configuration object from the file path.
    const conf = Config.new_from_file(config_location)

    // Return a new instance of Multicolour.
    return new multicolour(conf)
  }

  /**
   * Reset the config on this instance of Multicolour.
   * @param {String} config_location to load config from.
   */
  reset_from_config_path(config_location) {
    this.reset()
    this.set("config", Config.new_from_file(config_location))
    return this
  }

  /**
   * Create and return an instance of the CLI tool
   * which performs many few tasks, set the scope
   * of the CLI tool to this currently running instance
   * by default.
   * @return {CLI} CLI instance to run commands on.
   */
  cli() {
    return this.new("cli")
      .scope(this)
      .parse()
  }

  /**
   * We don't always want the user model,
   * if we do want it. Run this function to add it to
   * the list of known blueprints. Reduce noise for newcomers.
   *
   * @return {multicolour} multicolour instance with added blueprint.
   */
  _enable_user_model() {
    // Resolve the blueprint.
    const blueprint = require.resolve("./lib/user-model")

    // Help debuggers.
    this.debug("User model requested, registering blueprint." + blueprint)

    // Push our user model to the array of blueprints.
    this.get("database").register_new_model(blueprint)

    return this
  }

  /**
   * Scan the content directory for content like blueprints,
   * config files, etc and set the appropriate properties on
   * this instance of multicolour.
   * @return {multicolour} object for chaining.
   */
  scan() {
    // Get our content location.
    const content = this.get("config").get("content")

    // Debugging.
    this.debug("Scanning %s", content)

    // Get the file list.
    /* eslint-disable */
    const files = require("fs").readdirSync(`${content}/blueprints`)
    /* eslint-enable */
      // Delete crap like .DS_Store.
      .filter(file_name => file_name !== ".DS_Store")

      // Create a full path from it.
      .map(file => `${content}/blueprints/${file}`)

    // Debugging.
    this.debug("Scanned and found: %s", JSON.stringify(files, null, 2))

    // Set the blueprints property.
    this
      .set("has_scanned", true)
      .set("blueprints", files)

    // Set up the core plugins.
    this
      .use(require("./lib/db"))
      .use(require("./lib/storage"))
      .use(require("./lib/handlers"))

    // Debugging.
    this.debug("Finished scanning")

    return this
  }

  /**
   * Configure a plugin to run with Multicolour.
   * @param  {class} plugin to register.
   * @return {multicolour} object for chaining.
   */
  use(Plugin) {
    // Get some tools
    const plugin_id = this.request("new_uuid")

    // Extend the plugin to have bits and bobs it will likely need,
    // this is done via the Talkie library.
    this.extend(Plugin)
      .reply("host", this)
      .reply("id", plugin_id)

    // Create the plugin.
    const plugin = new Plugin(this)

    // Perform any registration it needs to do.
    plugin.register(this)

    return this
  }

  /**
   * Start the various services behind Multicolour.
   *
   * @return {Promise} promise of start in resolved state.
   */
  start() {
    // Check we've scanned for content and blueprints.
    if (!this.get("has_scanned"))
      return Promise.reject("Refusing to start services as you have not .scan()ed for content/blueprints.")

    // Create the validations.
    this.use(require("./lib/validator"))

    // Get the server & database.
    const server = this.get("server")
    const database = this.get("database")

    // Don't limit sockets.
    require("http").globalAgent.maxSockets = require("https").globalAgent.maxSockets = Infinity

    // When we ask the program to terminate,
    // do so as gracefully as programmatically possible.
    process.on("SIGINT", this.stop.bind(this, process.exit.bind(process), true))

    const report_error = err => {
      this.debug("There was an error while starting some or all of the service(s) and plugins. The error was", err)
      process.exit(1)
    }

    // Start our components up.
    return database.start()
      .then(() => {
        return server.start()
          .then(() => this.debug("All services and plugins started without error"))
          .catch(report_error)
      })
      .catch(report_error)
  }

  /**
   * Destroy all resources gracefully and terminate Multicolour.
   *
   * @return {Promise} Promise of stop routine finishing in resolved state.
   */
  stop(forced) {
    const server = this.get("server")
    const db = this.get("database")

    const tasks = [db.stop()]

    if (!server) {
      /* eslint-disable */
      console.error("There is no server defined to stop. There should; at least, be the default server configured")
      console.error("\nThis is unusual, do you have a plugin that sets the 'server' or did you not .scan() for content?")
      console.log("https://getmulticolour.com/docs/0.5.2/api-reference/#multicolour.scan")
      /* eslint-enable */
    }
    else
      tasks.push(server.stop())

    // Only ungracefully exit with confirmation.
    if (forced && !this.get("is_stopping")) {
      /* eslint-disable */
      /* istanbul ignore next: Untestable */
      console.info("Received SIGINT (interrupt signal). Press ctrl+c to quit ungracefully.")
      /* eslint-enable */
    }

    // Show intent to stop.
    this.set("is_stopping", true)

    // Stahp all the things.
    return Promise.all(tasks)
      .then(() => {
        this.debug("All services stopped successfully.")

        /* eslint-disable */
        console.log("Service stopped without error.")
        /* eslint-disable */

        // If it's forced, exit hard.
        if (forced) process.exit(0)
      })
      .catch(err => {
        this.debug("There was an error while trying to stop some or all of the services/plugins. The process will exit forcefully now but the error is: ", err)

        /* eslint-disable */
        console.error("An error occured while stopping your service.")
        console.error(err)
        /* eslint-enable */

        // Exit anyway.
        process.exit(1)
      })
  }
}

// Make Multicolour a messaging bus between
// the various open source projects behind it.
Talkie().extend(multicolour)

// Export the final Multicolour.
module.exports = multicolour
