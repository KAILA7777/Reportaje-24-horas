import type { Story } from "../types/story";

interface Props {
  story: Story;
  onOpen: () => void;
}

function StoryCard({ story, onOpen }: Props) {
  return (
    <button className="story-card" type="button" onClick={onOpen}>
      <img className="story-card__image" src={story.image} alt={story.username} />
      <p>{story.username}</p>
    </button>
  );
}

export default StoryCard;