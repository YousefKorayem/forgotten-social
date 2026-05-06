import mongoose, { Schema, type Model } from "mongoose";

export interface IFollow {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
}

const followSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });

const Follow: Model<IFollow> =
  (mongoose.models.Follow as Model<IFollow>) ??
  mongoose.model<IFollow>("Follow", followSchema);

export default Follow;
