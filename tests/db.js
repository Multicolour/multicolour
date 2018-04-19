"use strict"

// Get the testing library.
const tape = require("tape")

// Get Multicolour.
const Multicolour = require("../index")

tape("Waterline collections are created by Multicolour on instantiation and we only get expected errors.", test => {
  // Create an instance of multicolour.
  const multicolour = new Multicolour(require("./test_content/config.js")).scan()
  const DB = multicolour.get("database")

  // Enable the user model for seeding.
  test.doesNotThrow(() => multicolour._enable_user_model(), "No error while enablking user model.")

  // Test stuff exists.
  test.notEquals(typeof multicolour.get("blueprints"), "undefined", "Blueprints exists")
  test.notEquals(typeof DB, "undefined", "Database connection exists")

  // Test forceful relationship editing.
  // One to One
  test.doesNotThrow(() => DB.add_relation_to_collection("one2one", "test", "test2"), "Does not throw when forcefully extending collection.")

  // One to Many
  test.doesNotThrow(() => DB.add_relation_to_collection("one2many", "test", "test2", true), "Does not throw when forcefully extending collection as a collection.")

  // "join", is actually just a pretty way to add_relation_to_collection.
  test.doesNotThrow(() => DB
    .join({
      as: "join",
      from: "test2",
      to: "test3",
      many: true
    })
    .join({
      from: "test3",
      to: "test2"
    })
  )

  // Check error behaviour.
  test.throws(() => DB.register_new_model(), TypeError, "Throws error trying to register model with no path.")
  test.throws(() => DB.add_relation_to_collection("fake1", "fake", "test2"), ReferenceError, "Throws when source collection not found.")
  test.throws(() => DB.add_relation_to_collection("fake2", "test", "fake"), ReferenceError, "Throws when target collection not found.")
  test.throws(() => DB.add_relation_to_collection("one2one", "test", "test2"), TypeError, "Throws when trying to overwrite existing relationship.")

  multicolour.on("database_started", () => {
    test.pass("Received database_started event")
    test.ok(Object.keys(multicolour.get("database").raw_waterline_joi_models), "Generated Joi schema for base models")
    test.ok(Object.keys(multicolour.get("database").raw_waterline_joi_models_related), "Generated Joi schema for related models")
  })

  multicolour.on("database_stopped", () => {
    test.pass("Received database_stopped event")
  })

  // Seed for some more tests.
  DB.start()
    .then(ontology => {
      const models = ontology.collections

      const valid_model = {name: "Multicolour", age: 100, test: "multicolour"}
      const invalid_model = {age: 100}

      test.deepEqual(models.test.is_valid(valid_model).value, valid_model, "is_valid class member validates valid object")
      test.ok(models.test.is_valid(invalid_model).error, "is_valid class member validates invalid object")

      // Test various inserts.
      Promise.all([
        models.test.create({name: "test", age: 100, empty: null, test2: 1}),
        models.test2.create({name: "test", age: 100}),
        models.multicolour_user.create({
          username: "test",
          name: "test",
          password: "password"
        }),
        models.multicolour_user.create({
          username: "test2",
          name: "test2",
          email: null
        })
      // Done. We've checked for errors above. Just stop and quit.
      ])
        .then(results => {
          /* eslint-disable */
          test.doesNotThrow(() => results.forEach(result => result.toJSON()), "No error calling toJSON on test results")
          /* eslint-enable */

          test.pass("Database seeding and tests (4 rounds) completed without error.")
          DB.stop()
          test.end()
        })
        .catch(err => {
          DB.stop()
          test.fail("Database seeding and tests (4 rounds) completed with error " + err.message)
          test.end()
        })
    })
    .catch(err => {
      DB.stop()
      test.fail("Error in starting DB is undefined." + err.message)
      test.end()
    })
})
