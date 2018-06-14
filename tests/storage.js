"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index.js")
const storage = require("../lib/storage")

// Where we keep the test content.
const test_content_path = "./tests/test_content/"

tape("Default disk storage adapter.", test => {
  const multicolour = Multicolour
    .new_from_config_file_path(`${test_content_path}config.js`)
    .scan()

  test.doesNotThrow(() => multicolour.use(storage), "Registering default storage adapter does not throw error.")
  test.ok(multicolour.request("storage"), "Storage is set after registering storage plugin.")
  test.doesNotThrow(() => multicolour.request("storage").set_destination(require("os").tmpdir()), "Does not throw when changing destination")
  test.throws(() => multicolour.request("storage").upload(`${test_content_path}/circle.svg`), ReferenceError, "Upload without destination throws.")
  test.doesNotThrow(() => multicolour.request("storage").upload(`${test_content_path}/circle.svg`, "circle.svg"), "Uploading of a test file.")

  const test_stream = require("fs").createReadStream(`${test_content_path}/circle.svg`)

  test.doesNotThrow(() => multicolour.request("storage").upload(test_stream, "circle.svg"), "Uploading of stream.")
  test.doesNotThrow(() => multicolour.request("storage").get("circle.svg"), "Can retrieve file.")

  multicolour.stop()
    .then(() => test.end())
})
