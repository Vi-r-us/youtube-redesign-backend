import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { registerUser };
