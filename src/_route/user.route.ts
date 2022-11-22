import { Router } from "express";
import * as ctrl from "../_controller/user.controller";
import { validateResource } from "../_middlewares/zod.middleware";
import { userExistsSchema } from "../_schema/user.schema";
import { handleMiddlewareError } from "../_utils/async.util";
import { sendErrorResponse } from "../_utils/error.util";

export var router = Router();

// Check if the user exists OR not
router.get(
  "/exists",
  validateResource(userExistsSchema),
  handleMiddlewareError(ctrl.userExistsController),
  sendErrorResponse
);
