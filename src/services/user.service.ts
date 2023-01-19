import { FilterQuery } from "mongoose";

import User, { UserClass } from "../models/user.model";

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

export async function getUserWithSelectService(
  filter: FilterQuery<UserClass>,
  select: string
) {
  return User.findOne(filter).select(`${select} -__v`);
}
