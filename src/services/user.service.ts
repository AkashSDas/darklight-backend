import { FilterQuery } from "mongoose";

import { TUserClass, UserModel } from "../models/user.model";

export async function createUserService(user: Partial<TUserClass>) {
  return await UserModel.create(user);
}

export async function getUserService(filter: FilterQuery<TUserClass>) {
  return await UserModel.findOne(filter, "-__v").exec();
}

/** Service to get user data containing fields for whome `select=false` */
export async function getUserWithNotSelectedFields(
  filter: FilterQuery<TUserClass>,
  select: string
) {
  return await UserModel.findOne(filter).select(`${select} -__v`).exec();
}

export async function getUserCount(filter: FilterQuery<TUserClass>) {
  return await UserModel.count(filter).exec();
}

export async function updateUserService(
  filter: FilterQuery<TUserClass>,
  update: Partial<TUserClass>
) {
  return await UserModel.findOneAndUpdate(filter, update, {
    new: true,
    fields: "-_id -__v",
  }).exec();
}

export async function deleteUserService(filter: FilterQuery<TUserClass>) {
  return await UserModel.findOneAndDelete(filter).exec();
}
