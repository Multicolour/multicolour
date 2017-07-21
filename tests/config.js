"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")
const Config = require("../lib/config")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Multicolour initializes a config instance", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour({content: test_content_path}).scan()

  // Get the CLI from it.
  const config = multicolour.get("config")

  // Test it's not undefined and it is instantiated correctly.
  test.notEqual(typeof config, "undefined", "config should not be undefined")

  test.end()
})

tape("Config can `set` and `get`", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour({content: test_content_path}).scan()

  // Get the CLI from it.
  const config = multicolour.get("config")

  // Test it's not undefined and it is instantiated correctly.
  test.equal(typeof config.get("test"), "undefined", "config.get('test') should be undefined")

  config.set("test", 1)
  test.equal(config.get("test"), 1, "config.get('test') should be 1")

  test.end()
})

tape("Throws with invalid config", test => {
  test.throws(() => new Config({settings: {results: "nope"}}), Error, "Should throw an error with invalid config.")
  test.end()
})
