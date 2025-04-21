/**
 * @fileoverview This file defines the Video model for the YouTube redesign backend application.
 * It includes the schema definition and plugins for the Video model.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// This schema represents a video uploaded by a user.
const videoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true }, // Title of the video
    description: { type: String, trim: true }, // Description of the video

    videoFile: { type: String, required: true }, // URL of the video file
    thumbnail: { type: String, required: true }, // URL of the thumbnail image

    tags: { type: [String], default: [] }, // Tags associated with the video
    category: { type: String, default: "" }, // Category of the video
    views: { type: Number, default: 0 }, // Number of views
    duration: { type: Number }, // Duration of the video in seconds

    owner: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to the user who owns the video

    status: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    }, // Status of the video (public, private, unlisted)

    likesDislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "LikeDislike",
      },
    ], // References to the likes and dislikes associated with the video
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ], // References to the comments associated with the video
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Add pagination plugin to the video schema
videoSchema.plugin(mongooseAggregatePaginate);

// Create and export the Video model
export const Video = mongoose.model("Video", videoSchema);
