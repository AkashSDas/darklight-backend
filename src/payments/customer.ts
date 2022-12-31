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
    let result = await handleAsync(
      User.findById(userId).select("stripeCustomerId").exec()
    );

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
