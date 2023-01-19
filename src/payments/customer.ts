import { Types } from "mongoose";
import { handleAsync } from "../utils/async.util";
import Stripe from "stripe";
import User, { UserClass } from "../models/user.model";
import { DocumentType } from "@typegoose/typegoose";
import { stripe } from "..";

/**
 * Get or create customer
 *
 * @param userId - User's mongoId
 */
export async function getOrCreateCustomer(
  userId: Types.ObjectId,
  params?: Stripe.CustomerCreateParams
): Promise<Stripe.Customer | null> {
  {
    let result = await handleAsync(User.findById(userId).exec());

    if (result.error || !result.data) return null;
    var user = result.data as DocumentType<UserClass>;
  }

  // If user has a stripe customer id, retrieve it
  if (user.stripeCustomerId) {
    let result = await handleAsync(
      stripe.customers.retrieve(user.stripeCustomerId)
    );

    if (result.error || !result.data) return null;
    return result.data as Stripe.Customer;
  }

  // If user does not have a stripe customer id, create one
  {
    let result = await handleAsync(
      stripe.customers.create({
        email: user.email,
        metadata: {
          mongodbId: user._id.toString(),
        },
        ...params,
      })
    );

    if (result.error || !result.data) return null;
    let customer = result.data as Stripe.Customer;

    // Update user with stripe customer id
    user.stripeCustomerId = customer.id;
    await user.save();
    return customer;
  }
}

/**
 * Returns all the payment sources associated to the user
 */
export async function listPaymentMethod(userId: Types.ObjectId) {
  var result = await handleAsync(getOrCreateCustomer(userId));
  if (result.error || !result.data) return null;
  var customer = result.data as Stripe.Customer;
  return await stripe.paymentMethods.list({
    customer: customer.id,
    type: "card",
  });
}

/**
 * Creates a SetupIntent used to save a credit card for latest user
 *
 * Process of saving a credit card on a customer account is very similar
 * to how the payment intent api works, instead of payment intent you
 * create a setup intent and only parameter it requires is the customer id
 */
export async function createSetupIntent(userId: Types.ObjectId) {
  var customer = await getOrCreateCustomer(userId);
  return stripe.setupIntents.create({
    customer: customer.id,
  });
}
