import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * Generates access and refresh tokens for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Object} An object containing the access and refresh tokens.
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    // Find the user by ID
    const user = await User.findById(userId);

    // Generate access and refresh tokens
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Save the refresh token in the database
    user.refreshToken = refreshToken;
    // Save the user in the database without validating the password field
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (e) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

/**
 * Registers a new user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the created user data.
 */
const registerUser = asyncHandler(async (req, res) => {
  // Get the user data from the request body
  const { username, email, password, fullName } = req.body;

  // Check if all required fields are provided
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if the user already exists in the database
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with the same email or username already exists"
    );
  }

  // Check if the avatar and cover image are uploaded
  const avatarLocalPath =
    req.files && Array.isArray(req.files?.avatar) && req.files.avatar.length > 0
      ? req.files.avatar[0].path
      : undefined;
  const coverImageLocalPath =
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files.coverImage.length > 0
      ? req.files.coverImage[0].path
      : undefined;

  // Upload the avatar and cover image to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");
  const coverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImages");

  // Create a new user in the database
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
  });

  // Remove password and refresh token from the response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Return the response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

/**
 * Logs in a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the logged-in user data and tokens.
 */
const loginUser = asyncHandler(async (req, res) => {
  // Get user data from request body
  const { email, username, password } = req.body;

  // Check if all fields are provided
  if ((!username && !email) || !password) {
    throw new ApiError(400, "Username or email and password are required");
  }
  // Check if user exists in the database
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If user is not found then throw an error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if password is correct
  const isPasswordCorrect = await user.verifyPassword(password);

  // If password is incorrect then throw an error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect password");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Get the user from the database without password and refresh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Set access and refresh tokens as cookies
  const options = { httpOnly: true, secure: true };

  // Return response with tokens and user data
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

/**
 * Logs out a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object confirming the logout.
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Find the user by ID and update the refresh token to undefined
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  // If user is not found then throw an error
  if (!user) {
    throw new ApiError(500, "Something went wrong while logging out");
  }

  // Clear the cookies containing the access and refresh tokens
  const options = { httpOnly: true, secure: true };

  // Return response confirming the logout
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * Refreshes the access token using the provided refresh token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the new access and refresh tokens.
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get the refresh token from the request
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // If refresh token is not found then throw an error
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // Verify the refresh token using the secret key
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // If token is not verified then throw an error
    if (!decodedToken) {
      throw new ApiError(401, "Error while verifying refresh token");
    }

    // Find the user by ID from the decoded token
    const user = await User.findById(decodedToken?._id);

    // If user is not found, throw an error
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // If refresh token does not match then throw an error
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Set the options for the cookies
    const options = { httpOnly: true, secure: true };

    // Generate new access and refresh tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // Return response with new access and refresh tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    // If an error occurs, throw an unauthorized error with the error message
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

/**
 * Changes the current password of the logged-in user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with a success message.
 */
const currentPasswordChange = asyncHandler(async (req, res) => {
  // Get the old and new passwords from the request body
  const { oldPassword, newPassword } = req.body;

  // If old password or new password is not found, throw an error
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  // If old password and new password are the same, throw an error
  if (oldPassword === newPassword) {
    throw new ApiError(400, "Old password and new password are the same");
  }

  // Find the user by ID from the request user
  const user = await User.findById(req.user?._id);

  // Verify the old password using the user's verifyPassword method
  const isPasswordCorrect = await user.verifyPassword(oldPassword);

  // If old password is not correct, throw an error
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // If old password is correct, update the password with the new password
  user.password = newPassword;
  // Save the updated user to the database
  await user.save({ validateBeforeSave: false });

  // Return response with success message
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Gets the current user's information.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the current user's information.
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

/**
 * Updates the account details of the logged-in user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the updated user information.
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  // Get the full name and email from the request body
  const { fullName, email } = req.body;

  // If full name or email is missing, throw an error
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the user by ID and update the full name and email fields and remove the password and refresh token fields from the response
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password -refreshToken");

  // Return response with success message and updated user information
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * Updates the avatar of the logged-in user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the updated user information.
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  // Get the avatar local path and old avatar URL from the request file
  const avatarLocalPath = req.file?.path;
  const oldAvatar = req.user?.avatar;

  // If avatar is not found, throw an error
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload the avatar to Cloudinary and get the URL
  const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");

  // If avatar URL is not found, throw an error
  if (!avatar?.url) {
    throw new ApiError(400, "Something went wrong while uploading the avatar");
  }

  // Find the user by ID and update the avatar field and remove the password and refresh token fields from the response
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");

  // Remove the old avatar from Cloudinary
  if (oldAvatar) {
    await deleteImageFromCloudinary(oldAvatar);
  }

  // Return response with success message and updated user information
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

/**
 * Updates the cover image of the logged-in user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the updated user information.
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Get the cover image path and old cover image from the request file
  const coverImageLocalPath = req.file?.path;
  const oldCoverImage = req.user?.coverImage;

  // If cover image is not found, throw an error
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  // Upload the cover image to Cloudinary and get the URL
  const coverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImages");

  // If cover image URL is not found, throw an error
  if (!coverImage?.url) {
    throw new ApiError(
      400,
      "Something went wrong while uploading the cover image"
    );
  }

  // Find the user by ID and update the cover image field and remove the password and refresh token fields from the response
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");

  // Remove the old cover image from Cloudinary
  if (oldCoverImage) {
    await deleteImageFromCloudinary(oldCoverImage);
  }

  // Return response with success message and updated user information
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// TODO: Test that the getUserChannelProfile function works as expected (Postman)
/**
 * Gets the channel profile of a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the channel profile information.
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Get the username from the request parameters
  const { username } = req.params;
  // If username is not found, throw an error
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const userChannel = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribeTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribeTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  console.log(userChannel);

  if (!userChannel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userChannel[0],
        "Channel profile fetched successfully"
      )
    );
});

// TODO: Test that the getUserWatchHistory function works as expected (Postman)
/**
 * Gets the watch history of a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the watch history information.
 */
const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user?._id) } },
    {
      $lookup: {
        from: "watchhistories",
        localField: "_id",
        foreignField: "user",
        as: "watchHistory",
      },
    },
    {
      $lookup: {
        from: "watchhistories",
        localField: "_id",
        foreignField: "owner",
        as: "owner",
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  currentPasswordChange,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
