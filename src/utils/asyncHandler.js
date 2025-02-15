/**
 * @fileoverview This file contains a utility function to handle asynchronous route handlers in Express.
 * It wraps the route handler in a try-catch block to catch any errors and pass them to the next middleware.
 */

/**
 * Wraps an asynchronous route handler to catch any errors and pass them to the next middleware.
 * @param {Function} fn - The asynchronous route handler function.
 * @returns {Function} A new function that wraps the original route handler in a try-catch block.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    // Version 1: Uses Promise.resolve to handle the promise returned by the requestHandler function.
    // If the promise is rejected, it catches the error and passes it to the next middleware using next(err).
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

// Placeholder functions for demonstration purposes
// const asyncHandler = () => {};
// const asyncHandler = (fn) => () => {};
// const asyncHandler = (fn) => async () => {};

/**
 * Wraps an asynchronous route handler to catch any errors and respond directly to the client.
 * @param {Function} fn - The asynchronous route handler function.
 * @returns {Function} A new function that wraps the original route handler in a try-catch block.
 */
const asyncHandlerVersion2 = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    // Version 2: Uses try-catch to handle the promise returned by the fn function.
    // If an error is caught, it responds directly to the client with an error status and message.
    res
      .status(error.code || 500)
      .json({ success: false, error: error.message });
  }
};

export { asyncHandler };
