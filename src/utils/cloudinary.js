import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and removes the local file after uploading.
 * @param {string} localFilePath - The path to the local file to be uploaded.
 * @returns {Object|null} The upload result from Cloudinary or null if the upload fails.
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Return null if the local file path is not provided
    if (!localFilePath) return null;

    // Upload the local image file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("Upload successful: ", uploadResult.url);

    // Remove the local file after uploading to Cloudinary
    fs.unlinkSync(localFilePath);
    // Return the upload result from Cloudinary
    return uploadResult;
  } catch (error) {
    // Remove the local file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    console.error("Error uploading to Cloudinary: ", error);
    return null;
  }
};

/**
 * Deletes an image from Cloudinary based on its public ID.
 * @param {string} url - The URL of the image to be deleted from Cloudinary.
 */
const deleteImageFromCloudinary = async (url) => {
  try {
    // Extract the public ID from the URL
    const publicId = url.split("/").pop().split(".")[0];
    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    // Log the result of the deletion operation
    console.log("Image deleted from Cloudinary: ", result);
  } catch (error) {
    console.error("Error deleting image from Cloudinary: ", error);
  }
};

export { uploadOnCloudinary, deleteImageFromCloudinary };
