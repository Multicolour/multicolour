"use strict"

const Multicolour = require("../")

const ExampleService = Multicolour.new_from_config_file_path("../tests/test_content/config.js")

ExampleService.start()
  .then(() => console.log("Service started")) // eslint-disable-line no-console
  .catch(console.error.bind(console)) // eslint-disable-line no-console

