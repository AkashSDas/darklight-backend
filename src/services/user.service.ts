import { FilterQuery } from "mongoose";

import User, { UserSchema } from "../models/user.schema";

export async function createUserService(user: Partial<UserSchema>) {
  return await User.create(user);
}

export async function getUserService(filter: FilterQuery<UserSchema>) {
  return await User.findOne(filter, "-__v");
}

export function userExistsService(filter: FilterQuery<UserSchema>) {
  return User.exists(filter);
}

export async function deleteUserService(filter: FilterQuery<UserSchema>) {
  return User.findOneAndDelete(filter);
}

export async function updateUserService(
  filter: FilterQuery<UserSchema>,
  update: Partial<UserSchema>
) {
  return User.findOneAndUpdate(filter, update, { new: true, fields: "-__v" });
}

export async function getUserWithSelectService(
  filter: FilterQuery<UserSchema>,
  select: string
) {
  return User.findOne(filter).select(`${select} -__v`);
}
