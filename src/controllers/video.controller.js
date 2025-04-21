import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * Publishes a new video.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the published video.
 */
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, tags, category, status } = req.body;

  // Check if all required fields are present
  if (!title) {
    throw new ApiError(400, "Title is required.");
  }

  // Check if the video already exists in the database
  const existedVideo = await Video.findOne({ title });
  if (existedVideo) {
    throw new ApiError(409, "Video with the same title already exists.");
  }

  // Check if the video and thumbnail files are present
  const videoFilePath =
    req.files &&
    Array.isArray(req.files?.videoFile) &&
    req.files.videoFile.length > 0
      ? req.files.videoFile[0].path
      : undefined;
  const thumbnailPath =
    req.files &&
    Array.isArray(req.files?.thumbnail) &&
    req.files.thumbnail.length > 0
      ? req.files.thumbnail[0].path
      : undefined;

  if (!videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "Video and thumbnail files are required.");
  }

  // Upload the video and thumbnail files to cloudinary
  const videoFile = await uploadOnCloudinary(videoFilePath, "videos");
  const thumbnailFile = await uploadOnCloudinary(thumbnailPath, "thumbnails");

  console.log(videoFile, thumbnailFile);

  // Ensure default values for tags and category
  const sanitizedTags = tags && tags.length > 0 ? tags : undefined;
  const sanitizedCategory = category && category.trim() ? category : undefined;

  // Create a new video in the database
  const newVideo = await Video.create({
    title,
    description: description || "",

    videoFile: videoFile?.url || "",
    thumbnail: thumbnailFile?.url || "",

    tags: sanitizedTags,
    category: sanitizedCategory,
    duration: videoFile?.duration || 0,
    status,

    owner: req.user._id, // Assuming req.user contains the authenticated user's information
  });

  if (!newVideo) {
    throw new ApiError(500, "Failed to publish video.");
  }

  // Return the newly created video in the response
  return res
    .status(201)
    .json(new ApiResponse(200, newVideo, "Video published successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  // Get all videos from the database
  const videos = await Video.find();

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found.");
  }

  // Return the list of videos in the response
  return res.status(200).json(new ApiResponse(200, videos, "Videos fetched"));
});

export { publishVideo, getAllVideos };
