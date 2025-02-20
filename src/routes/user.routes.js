/**
 * @fileoverview This file defines the routes for user-related operations in the YouTube redesign backend application.
 * It includes routes for user registration, login, and logout.
 */

import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  currentPasswordChange,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// Route for user registration
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// Route for user login
router.route("/login").post(loginUser);
// Route for user logout
router.route("/logout").post(verifyJWT, logoutUser);

// Route for changing current password
router.route("/change-password").post(verifyJWT, currentPasswordChange);
// Route for getting current user details
router.route("/current-user").get(verifyJWT, getCurrentUser);
// Route for updating account details
router.route("/update-account-details").post(verifyJWT, updateAccountDetails);

// Route for updating user avatar
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
// Route for updating user cover image
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// Route for refreshing access token
router.route("/refresh-token").post(refreshAccessToken);

export default router;
