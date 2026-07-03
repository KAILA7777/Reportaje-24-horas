function StoryCard() {
  return (
    <div>
      <p>Mi Historia</p>
    </div>
  );
}

export default StoryCard;

interface Props {
  username: string;
  }

  function StoryCard({ username }: Props) {
  return (
    <div className="story-card">
      <div className="avatar"></div>
      <p>{username}</p>
    </div>
  );
}
export default StoryCard;