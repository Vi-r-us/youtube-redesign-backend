/**
 * @fileoverview This file defines a custom error class for handling API errors in the YouTube redesign backend application.
 * The ApiError class extends the built-in Error class to include additional properties such as statusCode, success, and errors.
 */

/**
 * Custom error class for handling API errors.
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   * @param {number} statusCode - The HTTP status code for the error.
   * @param {string} [message="Something went wrong"] - The error message.
   * @param {Array} [errors=[]] - Additional error details.
   * @param {string} [stack=""] - The stack trace for the error.
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode; // HTTP status code for the error
    this.data = null; // Placeholder for additional data (if any)
    this.message = message; // Error message
    this.success = false; // Indicates the success status (always false for errors)
    this.errors = errors; // Additional error details

    if (stack) {
      this.stack = stack; // Use provided stack trace if available
    } else {
      Error.captureStackTrace(this, this.constructor); // Capture stack trace
    }
  }
}

export { ApiError };
