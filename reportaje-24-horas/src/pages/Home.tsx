function Home() {
  return (
    <div>
      <h2>Historias</h2>
    </div>
  );
}

export default Home;

import StoryCard from "../components/StoryCard";
StoryCard";
import { stories } from "../data";

function Home() {
    return (
        <div>
        <h2>Historias</h2>

        <div className="stories-container">
        {stories.map((story) => (
            <StoryCard key={story.id} username={story.username} />
        ))}
        </div>
        </div>
    );
    }

    export default Home;