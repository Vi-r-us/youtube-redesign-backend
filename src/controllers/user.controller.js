import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

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
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
