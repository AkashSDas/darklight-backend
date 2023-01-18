import * as cloudinary from "cloudinary";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";

import User from "../models/user.model";
import { UpdateDetails, UserExists } from "../schema/user.schema";
import { USER_PROFILE } from "../utils/cloudinary.util";
import { UserRole } from "../utils/user";

// ==================================
// OTHER CONTROLLERS
// ==================================

/**
 * Check if the user exists OR not
 * @route GET /api/v2/user/exists
 * @remark Field to check are passed as query params
 * @remark Fields that can be used to check if the user exists are: email, username
 */
export async function userExistsController(
  req: Request<{}, {}, {}, UserExists["query"]>,
  res: Response
) {
  var { email, username } = req.query;
  var exists = await User.exists({ $or: [{ email }, { username }] });
  return res.status(200).json({ exists: exists?._id ? true : false });
}

// ==================================
// INFO CONTROLLERS
// ==================================

/**
 * Get logged in user info
 * @route GET /user/me
 *
 * Middelewares used:
 * - verifyAuth
 */
export async function getUserController(req: Request, res: Response) {
  return res.status(200).json({ user: req.user });
}

// ==================================
// INSTRUCTOR CONTROLLERS
// ==================================

/**
 * Add instructor role to the user
 * @route PUT /user/instructor-signup
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function instructorSignupController(req: Request, res: Response) {
  var user = req.user;
  if ((user.roles as UserRole[]).includes(UserRole.TEACHER)) {
    return res.status(400).json({ message: "Already a teacher" });
  }

  (user.roles as UserRole[]).push(UserRole.TEACHER);
  await (user as any).save();
  return res.status(200).json({ message: "Signed up as a teacher" });
}

/**
 * Update user details
 * @route PUT /user/details
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function updateDetailsController(
  req: Request<{}, {}, UpdateDetails["body"]>,
  res: Response
) {
  var user = req.user;

  if (req.user.email != req.body.email) {
    var emailExists = await User.exists({ email: req.body.email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }
  }

  if (req.user.username != req.body.username) {
    var usernameExists = await User.exists({ username: req.body.username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }
  }

  user.fullName = req.body.fullName;
  user.username = req.body.username;
  user.email = req.body.email;
  await user.save();
  return res.status(200).json({ message: "Details updated" });
}

/**
 * Update user profile image
 * @route PUT /user/profile-image
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function updateProfileImageController(
  req: Request,
  res: Response
) {
  var user = req.user;
  var image = req.files.profileImage;
  if (!image) return res.status(400).json({ message: "No image provided" });

  // Check if the image already exists
  if (user.profileImage?.id) {
    await cloudinary.v2.uploader.destroy(user.profileImage.id);
  }

  var result = await cloudinary.v2.uploader.upload(
    (image as UploadedFile).tempFilePath,
    { folder: USER_PROFILE }
  );
  user.profileImage = { id: result.public_id, URL: result.secure_url };
  await user.save();
  return res.status(200).json({ message: "Profile image updated" });
}
