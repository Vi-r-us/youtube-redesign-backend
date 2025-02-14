/**
 * @fileoverview This file contains the database connection logic for the YouTube redesign backend application.
 * It uses Mongoose to connect to a MongoDB database.
 */

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/**
 * Asynchronously connects to the MongoDB database using Mongoose.
 * The MongoDB URI is retrieved from the environment variables and the database name is imported from constants.
 * Logs a success message if the connection is successful, otherwise logs an error message and exits the process.
 */
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`Connected to MongoDB: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
