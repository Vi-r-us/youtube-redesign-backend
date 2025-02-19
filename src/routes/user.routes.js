/**
 * @fileoverview This file defines the routes for user-related operations in the YouTube redesign backend application.
 * It includes routes for user registration, login, and logout.
 */

import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
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
router.route("/login").post(
  loginUser
);

// Route for user logout
router.route("/logout").post(
  verifyJWT, logoutUser
);


export default router;
