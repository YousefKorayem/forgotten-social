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
