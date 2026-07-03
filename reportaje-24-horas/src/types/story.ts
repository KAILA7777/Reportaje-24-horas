export interface Story {
  id: string;
  username: string;
  image: string;
  caption?: string;
  mediaType?: "image" | "video";
  createdAt: string;
}