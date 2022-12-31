import { Request, Response } from "express";
import { listPaymentMethod } from "../payments/customer";

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
