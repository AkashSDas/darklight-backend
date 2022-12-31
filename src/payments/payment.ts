import { Types } from "mongoose";
import Stripe from "stripe";
import { stripe } from "..";
import { handleAsync } from "../utils/async.util";
import { getOrCreateCustomer } from "./customer";

/**
 * Create a Payment Intent with a specific amount
 */
export async function createPaymentIntent(
  userId: Types.ObjectId,
  amountToCharge: number
): Promise<Stripe.PaymentIntent | null> {
  var customer = await getOrCreateCustomer(userId);
  if (!customer) return null;

  const result = await handleAsync(
    stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: "inr",
      customer: customer.id,
      receipt_email: customer.email,
    })
  );

  if (result.error) return null;
  return result.data as Stripe.PaymentIntent;
}

/**
 * Create payment intent and charge
 *
 * @remarks
 * For this user has to be authenticated
 *
 * @returns Paytment intent if customer is retrieved and payment intent is
 * created else null
 */
export async function createPaymentIntentAndCharge(
  userId: Types.ObjectId,
  amountToCharge: number
): Promise<Stripe.PaymentIntent | null> {
  var customer = await getOrCreateCustomer(userId);
  if (!customer) return null;

  var result = await handleAsync(
    stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: "inr",
      customer: customer.id,
      off_session: true,
      confirm: true,
      receipt_email: customer.email,
    })
  );

  if (result.error) return null;
  return result.data as Stripe.PaymentIntent;
}
