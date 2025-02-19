/**
 * @fileoverview This file defines the Subscription model for the YouTube redesign backend application.
 * It includes the schema definition for the Subscription model.
 */

import mongoose, { Schema } from "mongoose";

// This schema represents a subscription where a user subscribes to a channel.
const subscriptionSchema = new Schema(
  {
    // ObjectId of the user who is subscribing
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    // ObjectId of the user who owns the channel being subscribed to
    channel: {
      type: Schema.Types.ObjectId, // channel being subscribed to
      ref: "User",
    },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Create and export the Subscription model
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
