"use strict"

module.exports = {
  "api_connections": {
    "host": "localhost",
    "port": 1811,
    "routes": {
      "cors": {
        "origin": [
          "*"
        ]
      }
    },
    "router": {
      "stripTrailingSlash": true
    }
  },
  "api_server": {
    "connections": {
      "routes": {
        "security": true
      }
    },
    "debug": {
      "request": [
        "error"
      ]
    }
  },
  "auth": {
    "password": "lwyK7Ii+c7jMLqSVVnqTVws7b6/OvFBdW5ykOIZAy60geKxRkkp5IZkbvMksrsZ+i1PBBahqtJ1cWJkreRRYbZy0K4sNTL0Xf23AdUWmqOGSxDvn3+eTaTBIROjEm6IyDSbuWQ=="
  },
  "content": "./content",
  "db": {
    "adapters": {
      "development": require("sails-disk"),
      "production": require("sails-disk")
    },
    "connections": {
      "development": {
        "adapter": "development",
        "database": "mc-cli-test",
        "user": "root",
        "host": "0.0.0.0"
      },
      "production": {
        "adapter": "production",
        "database": "mc-cli-test",
        "user": "root",
        "host": "0.0.0.0"
      }
    }
  }
}