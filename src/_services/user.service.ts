import { UserClass } from "../_models/user.model";
import User from "../_models/user.model";
import { FilterQuery } from "mongoose";

export async function createUserService(user: Partial<UserClass>) {
  return await User.create(user);
}

export async function getUserService(filter: FilterQuery<UserClass>) {
  return await User.findOne(filter, "-__v");
}

export function userExistsService(filter: FilterQuery<UserClass>) {
  return User.exists(filter);
}

export async function deleteUserService(filter: FilterQuery<UserClass>) {
  return User.findOneAndDelete(filter);
}

export async function updateUserService(
  filter: FilterQuery<UserClass>,
  update: Partial<UserClass>
) {
  return User.findOneAndUpdate(filter, update, { new: true, fields: "-__v" });
}
