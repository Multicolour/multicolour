"use strict"

// Get the testing library.
const tape = require("tape")
const tape_promise = require("blue-tape")

// Get Multicolour.
const Multicolour = require("../index.js")
const Plugin = require("../lib/plugin")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

class Alt extends Plugin {}

tape("(Stupid tests) Multicolour initializes with base properties.", test => {
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Has members.
  test.ok(multicolour.request, "Has request function.")
  test.ok(multicolour.reply, "Has reply function.")
  test.ok(multicolour.use, "Has use function.")
  test.ok(multicolour.scan, "Has scan function.")
  test.ok(multicolour.start, "Has start function.")
  test.ok(multicolour.stop, "Has stop function.")
  test.ok(Multicolour.Endpoint, "Has Endpoint lib.")
  test.ok(Multicolour.handlers, "Has handlers object.")
  test.ok(multicolour.Flow, "Flow property still exists.")

  // Replies with values.
  test.ok(multicolour.new("cli"), "Does reply with CLI member.")
  test.ok(multicolour.get("config"), "Does reply with config member.")
  test.ok(multicolour.request("new_uuid"), "Does reply with uuid.")

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour configures itself.", test => {
  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Get the config object to check a few things were done right.
  const config = multicolour.get("config")

  test.notEqual(typeof multicolour.get("config"), "undefined", "Config should exist.")
  test.throws(() => Multicolour.new_from_config_file_path(), ReferenceError, "Should throw without path argument")
  test.throws(() => multicolour.reset_from_config_path(), TypeError, "Should throw without path argument")
  test.doesNotThrow(() => multicolour.reset_from_config_path(test_content_path + "/config.js"), TypeError, "Should not throw with path argument")
  test.notEqual(typeof config.get("content"), "undefined", "Config should have a content property.")

  // Done and dusted. Go home.
  test.end()
})

tape_promise("Multicolour doesn't error when trying to start without scanning.", () => {
  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  return multicolour.start()
    .then(() => multicolour.stop())
})

tape("Multicolour can register plugins.", test => {
  // Load from a file.
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js")

  // Register a plugin.
  multicolour.scan().use(class {
    register() {
      test.pass("Plugin got registered.")
    }
  })

  test.doesNotThrow(() => multicolour.use(Alt), "Should not throw if plugin inherits from Multicolour.Plugin.")
  test.notEqual(typeof multicolour.get("server"), "undefined", "Should register server plugin.")

  test.end()
})

tape("Multicolour scans for and finds blueprints.", test => {
  const multicolour = Multicolour.new_from_config_file_path(test_content_path + "config.js").scan()

  test.notEqual(typeof multicolour.get("blueprints"), "undefined", "Blueprints should exist.")

  // Scan for content when there's no config set.
  test.throws(() => new Multicolour().scan(), Error, "Throws error when no content path is set.")

  // Done and dusted. Go home.
  test.end()
})

tape("Multicolour can start and stop a server and throws expected errors.", test => {
  // Expect N tests.
  test.plan(2)

  // Create an instance of Multicolour.
  const multicolour = Multicolour
    .new_from_config_file_path(test_content_path + "config.js")
    .scan()

  // Check when a server is configured properly that error is non-existent.
  multicolour.start()
    .then(() => {
      test.pass("No error when starting properly configured server plugin.")

      /* eslint-disable */
      multicolour.stop()
        .then(() => {
          test.pass("No error when stopping properly configured server plugin.")
        })
        .catch(err => {
          test.fail("Error when stopping properly configured server plugin.")
        })
    })
    .catch(err => {
      throw err
    })

  // test.throws(() => {
  //   new Multicolour({
  //     db: {},
  //     content: test_content_path
  //   })
  // }, Error, "Improperly configured DB throws on start with callback.")
})

tape("Multicolour global setup", test => {
  const config = require("./test_content/config.js")

  config.make_global = true

  // Create an instance of Multicolour.
  let multicolour = new Multicolour(config).scan()

  test.ok(global.multicolour, "Multicolour should be global when configured so.")

  multicolour.stop()
    .then(() => {
      multicolour = null
      delete global.multicolour
      delete config.make_global
      test.end()
    })
    .catch(err => {
      test.fail(err)
      test.end()
    })
})
