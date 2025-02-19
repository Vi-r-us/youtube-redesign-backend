/**
 * @fileoverview This file defines the User model for the YouTube redesign backend application.
 * It includes the schema definition, pre-save hooks, and instance methods for the User model.
 */

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    }, // Username of the user
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    }, // Email of the user

    fullName: { type: String, required: true, trim: true }, // Full name of the user
    role: {
      type: String,
      enum: ["viewer", "creator", "admin"],
    }, // Role of the user (viewer, creator, admin)

    avatar: { type: String }, // URL of the user's avatar
    coverImage: { type: String }, // URL of the user's cover image

    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ], // Array of video references for the user's watch history

    password: { type: String, required: [true, "Password is required"] }, // Password of the user
    refreshToken: { type: String }, // Refresh token for the user
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

// Pre-save hook to hash the password before saving the user document
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to verify the password
userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to generate an access token
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,  
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Instance method to generate a refresh token
userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
