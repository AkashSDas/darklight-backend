import { UserClass } from "../_models/user.model";
import User from "../_models/user.model";
import { FilterQuery } from "mongoose";

export async function createUserService(user: Partial<UserClass>) {
  return await User.create(user);
}

export async function getUserService(filter: FilterQuery<UserClass>) {
  return await User.findOne(filter, "-__v");
}

export async function userExistsService(filter: FilterQuery<UserClass>) {
  return await User.exists(filter);
}
