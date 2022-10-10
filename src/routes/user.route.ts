import { Router } from "express";

import { checkUserAvailableController } from "../controller/user.controller";
import { validateResource } from "../middlewares/validate-resource";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { checkUserAvailableSchema } from "../zod-schema/user.schema";

export var router = Router();

router.get(
  "/check/:field/:value",
  validateResource(checkUserAvailableSchema),
  handleMiddlewarelError(checkUserAvailableController),
  sendErrorResponse
);
