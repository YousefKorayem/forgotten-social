import mongoose, { Schema, type Model } from "mongoose";

export interface ILike {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

likeSchema.index({ user: 1, post: 1 }, { unique: true });
likeSchema.index({ post: 1 });

const Like: Model<ILike> =
  (mongoose.models.Like as Model<ILike>) ??
  mongoose.model<ILike>("Like", likeSchema);

export default Like;
