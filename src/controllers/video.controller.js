import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Check if all required fields are present
  if (!title || !description) {
    throw new ApiError(400, "Please provide title, and description");
  }
});

const getAllVideos = asyncHandler(async (req, res) => {});

export { publishVideo, getAllVideos };
