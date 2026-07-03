import type { Story } from "../types/story";

interface Props {
  story: Story;
  onOpen: () => void;
}

function StoryCard({ story, onOpen }: Props) {
  const isVideo = story.mediaType === "video";

  return (
    <button className="story-card" type="button" onClick={onOpen}>
      {isVideo ? (
        <div className="story-card__media story-card__media--video">
          <span>▶</span>
        </div>
      ) : (
        <img className="story-card__image" src={story.image} alt={story.username} />
      )}
      <p>{story.username}</p>
    </button>
  );
}

export default StoryCard;