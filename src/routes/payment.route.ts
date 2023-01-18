import { Router } from "express";

import {
  createPaymentIntentController,
  getUserPaymentCardsController,
  saveCardForUserController,
} from "../controller/payment.controller";
import verifyAuth from "../middlewares/auth.middleware";
import { handleMiddlewareError } from "../utils/async.util";
import { sendErrorResponse } from "../utils/error";

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

// Create payment intent and charge the user
router.post(
  "/charge",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(createPaymentIntentController),
  sendErrorResponse
);
