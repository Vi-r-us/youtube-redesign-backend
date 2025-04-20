import mongoose, { Schema } from "mongoose";

// This schema represents a video tag associated with a video.
const videoTagSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    }, // ObjectId of the video
    tag: {
      type: Schema.Types.ObjectId,
      ref: "Tag",
    }, // ObjectId of the tag
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Create and export the VideoTag model
export const VideoTag = mongoose.model("VideoTag", videoTagSchema);
