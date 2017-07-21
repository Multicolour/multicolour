"use strict"

// Get tools.
const fs = require("fs-extra")
const path = require("path")
const chalk = require("chalk")
const mkdirp = require("mkdirp")
const inquirer = require("inquirer")
const db_module_table = require("../../db-module-table")

// For the final report.
const completed = {}
const steps = {
  INSTALL_DEPENDENCIES: "Installed dependencies",
  CREATE_DATABASE: "Database exists",
  CONFIG_JS: "Created a config.js",
  COPY_EXAMPLE_CONTENT: "Copied example content",
  PACKAGE_JSON: "Created a package.json"
}

class CLI_Init {

  constructor(CLI) {
    this.CLI = CLI
  }

  program() {
    // Set up the init command.
    this.CLI.program
      .command("init [target]")
      .alias("I")
      .description("Create a new Multicolour project in the target/current directory and start the wizard.")
      .option("-t, --target <dir>", "Where to init.", "./")
      .action(this.run.bind(this))
  }

  welcome_message() {
    /* eslint-disable */
    console.log("The init process assumes you have installed a database technology on your computer/server.")
    console.log("Unless you choose memory or sqlite3 when prompted for a database technology this process will fail without the specified database technology installed.")
    console.log()
    console.log("Common database technologies have great installation guides and their links are below:")
    console.log()
    console.log("\tPostgreSQL: https://www.postgresql.org/download/")
    console.log("\tMySQL: https://dev.mysql.com/downloads/installer/")
    console.log("\tMariaDB: https://downloads.mariadb.org/mariadb/repositories/")
    console.log("\tMongoDB: https://docs.mongodb.com/manual/installation/#tutorials")
    console.log()
    /* eslint-enable */
  }

  /**
   * Do the init, ask a heap of questions
   * then create, copy and write all the files
   * and configs to where they need to be.
   *
   * @param  {String} init_path to create project at.
   * @return {Promise} promise in resolved state.
   */
  run(init_path) {
    this.welcome_message()

    init_path = init_path.toLowerCase().replace(/\s+/g, "-")

    // Default the init path to the current CWD.
    if (!init_path)
      init_path = "."

    /**
     * Where are we going to create this
     * new project? An absolute path to the
     * answer to the original init prompt.
     *
     * @type {String}
     */
    this.target = path.resolve(init_path)

    // We need to validate the package name for npm.
    const valid_name = require("validate-npm-package-name")

    // Ask the questions and return a promise.
    return inquirer.prompt([
      {
        default: "n",
        type: "input",
        name: "confirmed",
        message: `Creating a project in "${this.target}" will overwrite any existing project, are you sure?`,
        // Validate that they agreed.
        validate: is_okay => {
          if (is_okay.toLowerCase() === "no" || is_okay.toLowerCase() === "n")
            process.exit(0)
          else
            return true
        }
      },
      {
        type: "input",
        name: "project_name",
        message: "Enter your project's name (no spaces or special characters):",
        default: path.basename(this.target.replace(/\s+/, "-")).toLowerCase(),
        // Validate the package name.
        validate: value =>
          valid_name(value).validForNewPackages
            ? true
            : "Project name is invalid, check it doesn't contain spaces or special characters."
      },
      {
        type: "input",
        name: "description",
        message: "Enter your project's description:"
      },
      {
        type: "confirm",
        name: "seed",
        message: "Do you want to seed your database with random data?",
        default: false
      },
      {
        type: "list",
        name: "database",
        message: "What database technology would you like to use?",
        default: "postgresql",
        choices: Object.keys(db_module_table)
      },
      {
        when: answers => answers.database !== "memory" && answers.database !== "sqlite3",
        type: "input",
        name: "database_host",
        message: "Enter your database host:",
        default: "0.0.0.0"
      },
      {
        when: answers => answers.database !== "memory",
        type: "input",
        name: "database_username",
        message: "Enter your database username:",
        default: "root"
      },
      {
        when: answers => answers.database !== "memory",
        type: "password",
        name: "database_password",
        message: "Enter your database password:",
        default: ""
      },
      {
        type: "checkbox",
        name: "authentication",
        message: "What authentication do you want for your API?",
        choices: [
          "Email/Password (JWT)", "Twitter", "Facebook", "GitHub", "Google", "Instagram", "LinkedIn",
          "Yahoo", "Foursquare", "VK", "ArcGIS Online", "Windows Live", "Nest",
          "Phabricator", "BitBucket", "Reddit", "Tumblr"
        ]
      }
    ])
    .then(this.deal_with_init_answers.bind(this))
  }

  /**
   * Take the answers to the questions above
   * and do all the work.
   *
   * @param  {Array<mixed>} answers from the CLI.
   * @return {Promise} promise in resolved state.
   */
  deal_with_init_answers(answers) {
    // Make sure the target exists.
    mkdirp(this.target)

    // Work out what the user wants.
    const wantsJWT = answers.authentication.find(answer => answer === "Email/Password (JWT)")
    const wantsOauth = answers.authentication.filter(type => type !== "Email/Password (JWT)").length > 0

    // Create a base promise.
    let promise = Promise.resolve()

    if (wantsJWT || wantsOauth)
      answers.auth = {
        // Generate a nice, secure password to secure your users' sessions.
        password: require("crypto").createDiffieHellman(800).generateKeys("base64")
      }

    // Check for OAuth
    if (wantsOauth)
      promise = promise.then(this.get_oauth_config.bind(this, answers))

    // Check for either JWT or OAuth.
    if (wantsJWT || wantsOauth)
      promise = promise.then(this.ask_for_default_user.bind(this, answers))

    // Run all the tasks anyway.
    return promise
      .then(this.run_all_tasks.bind(this, answers))
      .catch(this.error_installing.bind(this))
  }

  /**
   * Ask for a username and password for
   * the initial user.
   *
   * @param  {String} target folder of the init.
   * @return {Promise} promise in resolved state.
   */
  ask_for_default_user(answers) {
    /* eslint-disable */
    console.info("These details are for YOUR api, they are not sent anywhere.")
    console.info("They will however be written (in plain text) to content/plugins/default-user.js")
    /* eslint-enable */

    const user_questions = [
      {
        default: "name@domain.com",
        type: "input",
        name: "email",
        message: "Enter an email address"
      },
      {
        default: "",
        type: "password",
        name: "password",
        message: "Enter a password"
      }
    ]

    return inquirer.prompt(user_questions)
      .then(auth_answers => {
        fs.readFile(require.resolve("../init/default-user.js"), (err, stream) => {
          if (err) throw err

          const file = stream.toString()
            .replace("const email = \"\"", `const email = "${auth_answers.email}"`)
            .replace("const password = \"\"", `const password = "${auth_answers.password}"`)
            .replace("const role = \"user\"", "const role = \"admin\"")

          mkdirp(`${this.target}/content/plugins/`, err => {
            if (err) throw err
            /* eslint-disable */
            fs.writeFile(`${this.target}/content/plugins/default-user.js`, file, err => {
              if (err) throw err
            })
            /* eslint-enable */
          })
        })

        return answers
      })
  }

  /**
   * Try to create the database the user specified,
   * if it already exists exit with success otherwise
   * just create and exit.
   *
   * @param  {Object} answers from the user to get database info from.
   * @return {Promise} promise in unresolved state.
   */
  create_database(answers) {
    // A list of SQL techs in the answers.
    const SQL_TECHS = new Set([
      "postgresql", "mysql"
    ])

    // If it's not an SQL adapter, just go ahead. All good.
    if (!SQL_TECHS.has(answers.database)) {
      completed.CREATE_DATABASE = true
      return Promise.resolve()
    }

    /* eslint-disable */
    console.log("Creating your database '%s', if it exists already we'll skip this.", answers.project_name)
    /* eslint-enable */

    // Otherwise, carry on and try to create the database.
    const Waterline = require("waterline")
    const context = new Waterline()
    const adapters = {check: require(this.target + "/node_modules/sails-" + answers.database)}
    const connections = {
      check: {
        adapter: "check",
        database: db_module_table[answers.database].adminDb,
        user: answers.database_username,
        host: answers.database_host,
        password: answers.database_password
      }
    }

    // Create a dummy model.
    const check_model = Waterline.Collection.extend({
      connection: "check",
      tableName: "check",
      attributes: {}
    })

    context.loadCollection(check_model)

    return new Promise((resolve, reject) => {
      // Connect.
      context.initialize({
        adapters: adapters,
        connections: connections
      }, (err, ontology) => {
        if (err)
          return reject({
            in: "CREATE_DATABASE",
            error: err
          })

        // Create the database.
        ontology.collections.check.query(`CREATE DATABASE ${answers.project_name};`, err => {
          // Check for errors and check the error message.
          if (err && err.message !== `database "${answers.project_name}" already exists`)
            return reject({
              in: "CREATE_DATABASE",
              error: err
            })

          // Drop the table if it were created.
          ontology.collections.check.query("DROP TABLE check;", () => {
            completed.CREATE_DATABASE = true
            context.teardown(resolve)
          })
        })
      })
    })
  }

  /**
   * Output a status of what did and didn't
   * run or complete running.
   *
   * @return {void}
   */
  output_status() {
    /* eslint-disable */
    console.log()
    Object.keys(steps).forEach(step => {
      if (completed[step])
        console.log("👍 " + steps[step])
      else
        console.log("👎 " + steps[step])
    })
    console.log()
    /* eslint-enable */
  }

  error_installing(error) {
    this.output_status()

    /* eslint-disable */
    console.log(chalk.red("Something went wrong while setting your project up, it could be an issue with your network or your database. Here's the error to help you work out which."))
    console.error(error)
    /* eslint-enable */
    process.exit(-1)
  }

  /**
   * Run all the tasks required to initialise an app.
   *
   * @param  {Array<mixed>} answers from the CLI.
   * @return {Promise} promise in resolved state.
   */
  run_all_tasks(answers) {
    Promise.all([
      // Write the config.js template.
      this.create_config_js_file(answers),

      // Write the package.json
      this.write_package_json_file(answers),

      // Copy the example content over.
      this.copy_example_content(),

      // Install all the dependencies in the package.json we created.
      this.install_dependencies(),
    ])
    .then(() => {
      // Try to create or connect to the specified database.
      return this.create_database(answers)
    })
    .then(() => {
      this.output_status()

      /* eslint-disable */
      console.log(chalk.green(`We've generated a few files for you and copied a few things around, This includes a config.js and a content/ folder.`))
      console.log(chalk.green(`Running cd ${chalk.underline(this.target)} then ${chalk.underline("npm start")} will start running your REST API.`))
      console.log(chalk.bold("If you have any issues, join us on Slack https://slack.getmulticolour.com"))
      console.log()
      /* eslint-enable */
      process.exit(0)
    })
    .catch(this.error_installing.bind(this))
  }

  /**
   * Once the generation has completed, this function
   * is called and it will install all the plugins
   * automatically.
   *
   * @return {Promise} unresolved promise.
   */
  install_dependencies() {
    /* eslint-disable */
    console.info("Installing your API's dependencies- Not any databases.")
    /* eslint-enable */

    const spawn = require("cross-spawn")

    const npmi = spawn("npm", ["install"], {
      cwd: this.target
    })

    return new Promise((resolve, reject) => {
      /* eslint-disable */
      npmi.stdout.on("data", data_buff => console.log(data_buff.toString()))
      /* eslint-enable */
      npmi.on("error", error_buff => reject({
        in: "INSTALL_DEPENDENCIES",
        error: error_buff.toString()
      }))

      npmi.on("close", () => {
        completed.INSTALL_DEPENDENCIES = true
        resolve()
      })
    })
  }

  /**
   * OAuth providers require the client id and secret
   * in order to function. Ask for them here and apply
   * the config to the auth object in the config.
   *
   * @param  {Object} answers given by the user.
   * @return {Promise} promise in resolved state.
   */
  get_oauth_config(answers) {
    const providers = answers.authentication.filter(provider => provider !== "JWT")

    if (!providers.length)
      return Promise.resolve(answers)

    return inquirer.prompt(providers.reduce((questions, provider) => {
      // Don't ask for JWT.
      if (provider === "JWT")
        return questions

      questions.push({
        type: "input",
        name: provider + "_id",
        message: `Enter the client ID for your ${provider} app:`,
        required: true
      })

      questions.push({
        type: "input",
        name: provider + "_secret",
        message: `Enter the client secret for your ${provider} app:`,
        required: true
      })

      return questions
    }, []))
      .then(provider_answers => {
        answers.auth.providers = providers.map(strategy => {
          return {
            provider: strategy.toString().toLowerCase(),
            clientId: provider_answers[strategy + "_id"],
            clientSecret: provider_answers[strategy + "_secret"],
            isSecure: false
          }
        })

        return answers
      })
  }

  /**
   * Write a formatted config file based on a series
   * of answers from the developer.
   * @param  {Object} answers given by the developer.
   * @param  {Object} provider_config for configuring OAuth providers.
   *                                  Usually called by this function.
   * @return {void}
   */
  create_config_js_file(answers) {
    /* eslint-disable */
    console.info("Writing config.js")
    /* eslint-enable */

    // Get the target init directory.
    const target = this.target

    // Get the template data to generate from.
    const user_config = require("../init/config")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database.toString().toLowerCase()]

    let contents = "\"use strict\""

    // Update the user configuration.
    user_config.content = "./content"

    if (answers.auth)
      user_config.auth = answers.auth

    // The config that will be written to disk.
    const db_conf = {
      adapter: "development",
      database: answers.project_name,
      user: answers.database_username,
      host: answers.database_host
    }

    if (answers.database_password)
      db_conf.password = answers.database_password

    user_config.db.connections.development = db_conf
    user_config.db.connections.production = Object.assign({}, db_conf, {adapter: "production"})

    // If a default port is set, add it to the config.
    if (db_type.port) {
      user_config.db.connections.development.port = db_type.port
      user_config.db.connections.production.port = db_type.port
    }

    // We'll do a replacement on this later so we only
    // have to open the file for writing once.
    user_config.db.adapters.development = "require({{DB}})"
    user_config.db.adapters.production = "require({{DB}})"

    // Re-order the keys, gives a better dev experience
    // with a more natural ordering.
    Object.keys(user_config).sort().forEach(key => {
      const value = user_config[key]
      delete user_config[key]
      user_config[key] = value
    })

    // Finalise the string interpolation.
    contents = `${contents}\n\nmodule.exports = ${JSON.stringify(user_config, " ", 2)}`
    contents = contents.replace(/"require\({{DB}}\)"/g, `require("${db_type.name}")`)

    // Write the package.json
    return new Promise((resolve, reject) => {
      fs.writeFile(`${target}/config.js`, contents, err => {
        if (err)
          reject({
            in: "CONFIG_JS",
            error: {
              message: "Failed to write config.js. Please paste the below into config.js manually",
              data: user_config
            }
          })
        else {
          completed.CONFIG_JS = true
          resolve()
        }
      })
    })
  }

  /**
   * Copy the example content into place.
   * @return {void}
   */
  copy_example_content() {
    /* eslint-disable */
    console.info("Copying example content")
    /* eslint-enable */

    return new Promise((resolve, reject) => {
      fs.copy(__dirname + "/../init/content", `${this.target}/content`, err => {
        if (err) reject({
          in: "COPY_EXAMPLE_CONTENT",
          error: err
        })
        else {
          completed.COPY_EXAMPLE_CONTENT = true
          resolve()
        }
      })
    })
  }

  /**
   * Write a formatted JSON file based on a series
   * of answers from the developer.
   *
   * @param  {Object} answers given by the developer.
   * @return {void}
   */
  write_package_json_file(answers) {
    /* eslint-disable */
    console.info("Writing package.json")
    /* eslint-enable */

    // Get the target init directory.
    const target = this.target

    // Get the template data to generate from.
    const user_package = require("../init/package.json")

    // Get the database type we specified.
    const db_type = db_module_table[answers.database.toString().toLowerCase()]

    // Add the name.
    user_package.name = answers.project_name.toString().toLowerCase()

    // Add the database dependency.
    user_package.dependencies[db_type.name] = db_type.version

    // Did the user want to seed the database?
    if (answers.seed) user_package.dependencies["multicolour-seed"] = "^0.0.6"

    const server_plugin = {
      as: "server",
      name: "multicolour-server-hapi",
      plugins: []
    }

    // Which auth plugin does the developer want? (if any)
    if (answers.authentication.length > 0) {
      if (answers.authentication.find(type => type === "JWT")) {
        user_package.dependencies["multicolour-hapi-jwt"] = "^0.1.4"
        server_plugin.plugins.push("multicolour-hapi-jwt")
      }

      if (answers.authentication.filter(type => type !== "JWT").length > 0) {
        user_package.dependencies["multicolour-auth-oauth"] = "^1.2.1"
        server_plugin.plugins.push("multicolour-auth-oauth")
      }

      user_package.multicolour.plugins.push("/content/plugins/default-user")
    }

    // Add the (currently) only supported server plugin.
    user_package.multicolour.plugins.push(server_plugin)

    // Add the description.
    user_package.description = answers.description || user_package.name

    // Write the package.json
    return new Promise((resolve, reject) => {
      // Serialize the data.
      const serialized = JSON.stringify(user_package, null, 2)

      // Write the file.
      fs.writeFile(`${target}/package.json`, serialized, err => {
        if (err)
          reject({
            in: "PACKAGE_JSON",
            error: {
              message: "Failed to write package.json. Please paste the below into package.json manually.",
              data: JSON.stringify(user_package, null, 2)
            }
          })
        else {
          completed.PACKAGE_JSON = true
          resolve()
        }
      })
    })
  }
}

module.exports = CLI_Init
