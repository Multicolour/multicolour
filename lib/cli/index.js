"use strict"

// For path resolution.
const debug = require("debug")

class cli {
  /**
   * Set up commander to accept the various
   * arguments and commands that make multicolour
   * easy to get started with.
   * @return {multicolour} Object for chaining.
   */
  constructor() {
    this.debug = debug("multicolour:cli")

    // Create a program.
    this.program = require("commander")

    // Set up the init command.
    this.program
      .command("version")
      .description("Show the version of Multicolour installed.")
      /* eslint-disable */
      .action(() => console.log(require("../../package.json").version))
      /* eslint-enable */

    this.scan()

    // Exit.
    return this
  }

  /**
   * Scan the plugins folder and register each plugin.
   *
   * @return {CLI}
   */
  scan() {
    const fs = require("fs")
    const path = require("path")
    const plugins = path.resolve(__dirname + "/plugins/")

    // Get the file list.
    /* eslint-disable no-sync */
    const modules = fs.readdirSync(plugins)
    /* eslint-enable no-sync */
      // Delete crap like .DS_Store.
      .filter(file_name => file_name !== ".DS_Store")

      // Create a full path from it.
      .map(file => require(`${plugins}/${file}`))

    // Register all the plugins.
    modules.forEach(this.use.bind(this))

    return this
  }

  /**
   * Register a plugin to use on the CLI.
   *
   * @param  {Function} Plugin to register.
   * @return {CLI}
   */
  use(Plugin) {
    const instance = new Plugin(this)

    instance.program()

    return this
  }

  /**
   * Parse the/any arguments passed
   * through via the cli.
   * @return {cli} Object for chaining.
   */
  parse() {
    // Parse the args.
    this.program.parse(process.argv)

    // Check the length of the arguments passed in
    // so we know whether to show the help message or not.
    if (!process.argv.slice(2).length)
      this.program.outputHelp()

    // Exit.
    return this
  }

  /**
   * Set the scope of the operations conducted
   * by this instance of the CLI tool.
   * @param  {multicolour} target_multicolour to use as the scope.
   * @return {cli} Object for chaining.
   */
  scope(target_multicolour) {
    // Check we got a target.
    if (!target_multicolour) {
      throw new ReferenceError("Target should be defined to set scope.")
    }

    // Set the scope of this CLI to an instance of Multicolour.
    this.__scope = target_multicolour

    // Return for chaining.
    return this
  }
}

module.exports = cli
