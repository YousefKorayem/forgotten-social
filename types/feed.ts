export type FeedAuthor = {
  id: string;
  username: string;
  name: string;
  image: string | null;
};

export type FeedPost = {
  id: string;
  content: string;
  likeCount: number;
  /** Present when the viewer is signed in (whether they liked this post). */
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
  author: FeedAuthor;
};

export type PostsApiResponse = {
  posts: FeedPost[];
  nextCursor: string | null;
};

export type PostCreateApiResponse = {
  post: FeedPost;
};
