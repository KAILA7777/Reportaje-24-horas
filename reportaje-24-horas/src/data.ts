import type { Story } from "./types/story";

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);

export const initialStories: Story[] = [
  {
    id: "1",
    username: "luis",
    image: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
    caption: "Hola, ya subí mi historia",
    createdAt: oneHourAgo.toISOString(),
  },
  {
    id: "2",
    username: "maria",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    caption: "Nueva historia de prueba",
    createdAt: twentyThreeHoursAgo.toISOString(),
  },
];