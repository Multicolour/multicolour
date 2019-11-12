"use strict"

module.exports = {
  mongo: {
    name: "sails-mongo",
    version: "0.12.1",
    port: 27017
  },
  postgresql: {
    name: "sails-postgresql",
    version: "0.12.1",
    port: 5432,
    adminDb: "postgres"
  },
  mysql: {
    name: "sails-mysql",
    version: "0.11.5",
    mysql: 3306,
    adminDb: "mysql"
  },
  mariadb: {
    name: "sails-mysql",
    version: "0.11.5",
    mysql: 3306,
    adminDb: "mysql"
  },
  redis: {
    name: "sails-redis",
    version: "0.10.7",
    port: 6379
  },
  cassandra: {
    name: "sails-cassandra",
    version: "0.10.10"
  },
  arango: {
    name: "sails-arangodb",
    version: "0.2.3",
    port: 8529
  },
  nedb: {
    name: "sails-nedb",
    version: "0.10.1-a3"
  },
  sqlite3: {
    name: "waterline-sqlite3",
    version: "git+https://github.com/newworldcode/sqlite3-adapter.git"
  },
  memory: {
    name: "sails-memory",
    version: "0.10.7"
  }
}
