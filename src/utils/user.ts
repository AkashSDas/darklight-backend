import { TUserClass } from "../models/user.model";

export function userDataToSend(data: TUserClass) {
  return {
    id: data._id,
    email: data.email,
    username: data.username,
    fullName: data.fullName,
    roles: data.roles,
    isActive: data.isActive,
    verified: data.isEmailVerified,
    profileImage: data.profileImage,
    oauthProviders: data.oauthProviders,
    createdAt: (data as any).createdAt,
    updatedAt: (data as any).updatedAt,
  };
}
