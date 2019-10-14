"use strict"

module.exports = {
  mongo: {
    name: "sails-mongo",
    version: "^1.0.1",
    port: 27017
  },
  postgresql: {
    name: "sails-postgresql",
    version: "^1.0.2",
    port: 5432,
    adminDb: "postgres"
  },
  mysql: {
    name: "sails-mysql",
    version: "^1.0.1",
    mysql: 3306,
    adminDb: "mysql"
  },
  mariadb: {
    name: "sails-mysql",
    version: "^1.0.1",
    mysql: 3306,
    adminDb: "mysql"
  },
  redis: {
    name: "sails-redis",
    version: "^1.0.0",
    port: 6379
  },
  cassandra: {
    name: "sails-cassandra",
    version: "^0.12.15"
  },
  sqlite3: {
    name: "waterline-sqlite3",
    version: "git+https://github.com/newworldcode/sqlite3-adapter.git"
  },
  disk: {
    name: "sails-disk",
    version: "^1.1.2"
  }
}
