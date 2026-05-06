import mongoose, { Schema, type Model } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  passwordHash?: string;
  name: string;
  image?: string;
  bio?: string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    image: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 160,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>("User", userSchema);

export default User;