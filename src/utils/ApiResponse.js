/**
 * @fileoverview This file defines a custom response class for handling API responses in the YouTube redesign backend application.
 * The ApiResponse class includes properties such as statusCode, data, message, and success.
 */

/**
 * Custom response class for handling API responses.
 */
class ApiResponse {
  /**
   * Creates an instance of ApiResponse.
   * @param {number} statusCode - The HTTP status code for the response.
   * @param {any} data - The data to be included in the response.
   * @param {string} [message="Success"] - The response message.
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode; // HTTP status code for the response
    this.data = data; // Data to be included in the response
    this.message = message; // Response message
    this.success = statusCode < 400; // Indicates the success status (true if statusCode is less than 400)
  }
}

export { ApiResponse };
