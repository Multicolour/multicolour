"use strict"

const Http_Error = require("../http-error")
const utils = require("../utils")

module.exports = function UPLOADHandler(model, request, callback) {
  // Start with the id.
  const qs = {id: request.params.id}

  // Compile constraints if there are any.
  if (model.constraints && model.constraints.post) {
    const constraints = utils.compile_constraints(request, model.constraints.post)

    // Extend the constraints onto the query.
    Object.assign(qs, constraints)
  }

  // Get the key we'll use to store the location.
  let key = model.can_upload_file

  // If it was just a boolean, use a default key.
  if (typeof model.can_upload_file === "boolean") {
    key = "file"
  }

  // Find the media data.
  model.findOne(qs, (err, models) => {
    // Check for errors.
    if (err) {
      /* istanbul ignore next: Untestable */
      callback(err, null, model)
    }
    // Check we found models.
    else if (!models) {
      callback(
        new Http_Error(`Upload failed, could not find the host document with the id "${request.params.id}".`, 404),
        null,
        model
      )
    }
    // Upload the file.
    else {
      // Get the target extension & name.
      const uuid = model.multicolour_instance.request("new_uuid")
      const extension = require("path").extname(request.payload.file.filename).toLowerCase()
      const name = `${this.file_path || ""}${uuid}${extension}`

      // Get storage config.
      const storage_config_keys = model.multicolour_instance.request("storage_config_keys")
      const storage_config = {
        name: name,
      }

      // Get any config available from the model.
      if (storage_config_keys) {
        storage_config_keys.forEach(key => {
          storage_config[key] = this[key]
        })
      }

      const endedHandler = () => {
        // Get the update attributes.
        const attributes = {
          pending: false,
          [key]: storage_config.name
        }

        // Update the model and reply with the updated model.
        model.update({id: models.id}, attributes, err => {
          if (err) {
            /* istanbul ignore next: Untestable */
            callback(err, null, model)
          }
          else {
            this.GET(model, request, callback, 202)
          }
        })
      }

      // Upload the file.
      model.multicolour_instance.request("storage")
        .upload(request.payload.file.path, storage_config)
        /* istanbul ignore next: Untestable */
        .on("error", err => callback(err, null, model))
        .on("finish", endedHandler)
        .on("end", endedHandler)
    }
  })
}
