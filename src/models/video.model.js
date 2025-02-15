/**
 * @fileoverview This file defines the Video model for the YouTube redesign backend application.
 * It includes the schema definition and plugins for the Video model.
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true }, // Title of the video
    description: { type: String, required: true, trim: true }, // Description of the video

    // TODO: Cloudinary URL for thumbnail and video file
    videoFile: { type: String, required: true }, // URL of the video file
    thumbnail: { type: String, required: true }, // URL of the thumbnail image

    tags: { type: [String], required: true }, // Tags associated with the video
    views: { type: Number, default: 0 }, // Number of views
    duration: { type: Number, required: true }, // Duration of the video in seconds
    isPublished: { type: Boolean, default: true }, // Publication status of the video

    owner: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to the user who owns the video

    // likes: { type: Number, default: 0 },
    // dislikes: { type: Number, default: 0 },
    // comments: { type: [String], default: [] },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Add pagination plugin to the video schema
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
