/**
 * @fileoverview This file defines the WatchHistory model for the YouTube redesign backend application.
 * It includes the schema definition for the WatchHistory model.
 */
import mongoose, { Schema } from "mongoose";

// This schema represents the watch history of a user for a specific video.
const watchHistorySchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    }, // ObjectId of the video being watched
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }, // ObjectId of the user who watched the video
    progress: { type: Number, default: 0 }, // Progress of the video watched
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
); 

// Create a unique index on the combination of video and owner fields
watchHistorySchema.index({ video: 1, owner: 1 }, { unique: true });

// Create and export the WatchHistory model
export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
