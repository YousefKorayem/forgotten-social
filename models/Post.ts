import mongoose, { Schema, type Model } from "mongoose";

export interface IPost {
  author: mongoose.Types.ObjectId;
  content: string;
  likeCount: number;
}

const postSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 280,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) ??
  mongoose.model<IPost>("Post", postSchema);

export default Post;
