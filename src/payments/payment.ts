import { Types } from "mongoose";
import Stripe from "stripe";
import { stripe } from "..";
import { handleAsync } from "../utils/async.util";
import { getOrCreateCustomer } from "./customer";

/**
 * Create a Payment Intent with a specific amount
 */
export async function createPaymentIntent(amount: number) {
  // In this implementation we don't have authenticated users or anything like that, this is
  // just one off payment and it doesn't even require a user to be logged in to our app. However
  // it is possible to passin in existing customer or an existing payment source to your payment
  // intent

  // The paymentIntent object return from stripe will have an id and a status. The status of
  // the payment intent will change over the lifecycle of the payment, usually this is managed by
  // Stripe directly but it's good to remember it.

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    // receipt_email: 'james@gmail.com',
  });

  return paymentIntent;
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

  console.log(result);
  if (result.error) return null;
  return result.data as Stripe.PaymentIntent;
}
