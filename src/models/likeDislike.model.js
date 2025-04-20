import mongoose, { Schema } from "mongoose";

const likeDislikeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    }, // ObjectId of the video
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    }, // ObjectId of the post
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    }, // ObjectId of the comment
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }, // ObjectId of the user who liked/disliked the video
    isLike: { type: Boolean, required: true }, // Boolean indicating if the like/dislike is a like (true) or a dislike (false)
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt timestamps

export const LikeDislike = mongoose.model("LikeDislike", likeDislikeSchema);
