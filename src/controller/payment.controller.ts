import { Request, Response } from "express";
import { createSetupIntent, listPaymentMethod } from "../payments/customer";
import { createPaymentIntent } from "../payments/payment";

export async function getUserPaymentCardsController(
  req: Request,
  res: Response
) {
  var cards = await listPaymentMethod(req.user._id);
  if (!cards) {
    return res.status(400).json({
      success: false,
      message: "Could not get payment cards",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Payment cards retrieved",
    data: { cards: cards.data },
  });
}

export async function saveCardForUserController(req: Request, res: Response) {
  var setupIntent = await createSetupIntent(req.user._id);
  if (!setupIntent) {
    return res.status(400).json({
      success: false,
      message: "Could not create setup intent",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Setup intent created",
    data: { setupIntent },
  });
}

export async function createPaymentIntentController(
  req: Request,
  res: Response
) {
  var { amountToCharge } = req.body;
  var paymentIntent = await createPaymentIntent(req.user._id, amountToCharge);

  if (!paymentIntent) {
    return res.status(400).json({
      success: false,
      message: "Could not create payment intent",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Payment intent created",
    data: { paymentIntent },
  });
}
