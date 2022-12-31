import { Router } from "express";
import {
  getUserPaymentCardsController,
  saveCardForUserController,
} from "../controller/payment.controller";
import verifyAuth from "../middlewares/auth.middleware";
import { handleMiddlewareError } from "../utils/async.util";
import { sendErrorResponse } from "../utils/error.util";

export var router = Router();

// Get all payment cards of the user
router.get(
  "/cards",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(getUserPaymentCardsController),
  sendErrorResponse
);

// Get all payment cards of the user
router.post(
  "/save-card",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(saveCardForUserController),
  sendErrorResponse
);
