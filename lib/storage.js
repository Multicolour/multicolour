"use strict"

// Get the tools we need.
const os = require("os")
const fs = require("fs")
const Plugin = require("./plugin")
const resolve = require("path").resolve

class Multicolour_Disk_Storage extends Plugin {

  /**
   * Create default options and values.
   * @return {Multicolour_Disk_Storage} Object for chaining.
   */
  constructor() {
    super()

    // Set up the default options.
    this.options = {
      path: os.tmpdir()
    }

    return this
  }

  set_destination(path) {
    this.options.path = resolve(path.toString())
    return this
  }

  register(multicolour) {
    multicolour.reply("storage", this)
  }

  /**
   * Upload a file to disk and return a writable stream.
   * @param  {ReadableStream|String} stream or path to upload to S3.
   * @param  {String} destination to write the file to.
   * @return {Object} object containing the stream and a bound abort method.
   */
  upload(file, destination) {
    // Check we got a destination.
    if (!destination) {
      throw new ReferenceError("No destination for uploaded file")
    }
    // Upload the file.
    else {
      const full_destination = `${this.options.path}/${destination}`
      const writable_stream = fs.createWriteStream(full_destination)

      // Check if we got a readable stream, in.
      if (file && file.pipe) {
        file.pipe(writable_stream)
      }
      // Otherwise, read the file out.
      else {
        fs.createReadStream(file).pipe(writable_stream)
      }

      // Return the stream.
      return writable_stream
    }
  }

  /**
   * Download a file from disk and return
   * an EventEmitter to listen for data events.
   * @param  {multicolour/File} file to get from disk.
   * @return {fs.ReadableStream} object to listen for event
   */
  get(file) {
    return fs.createReadStream(`${this.options.path}/${file}`)
  }
}

// Export the required config for Multicolour to register.
module.exports = Multicolour_Disk_Storage
