import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import StoryCard from "../components/StoryCard";
import { initialStories } from "../data";
import type { Story } from "../types/story";

const STORAGE_KEY = "stories-24h";
const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const STORY_VIEW_DURATION_MS = 4000;

function isStoryActive(story: Story, now = new Date()) {
  return new Date(story.createdAt).getTime() + STORY_TTL_MS > now.getTime();
}

function normalizeStories(stories: Story[]) {
  return stories.filter((story) => isStoryActive(story));
}

function Home() {
  const [stories, setStories] = useState<Story[]>(() => {
    if (typeof window === "undefined") {
      return normalizeStories(initialStories);
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return normalizeStories(initialStories);
    }

    try {
      const parsed = JSON.parse(saved) as Story[];
      return normalizeStories(parsed);
    } catch {
      return normalizeStories(initialStories);
    }
  });
  const [username, setUsername] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [storyProgressKey, setStoryProgressKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    }
  }, [stories]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStories((current) => normalizeStories(current));
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStoryIndex === null || stories.length === 0) {
      return;
    }

    if (selectedStoryIndex >= stories.length) {
      setSelectedStoryIndex(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectedStoryIndex((current) => {
        if (current === null) {
          return null;
        }

        return current + 1 >= stories.length ? null : current + 1;
      });
      setStoryProgressKey((current) => current + 1);
    }, STORY_VIEW_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [selectedStoryIndex, stories.length, stories]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setImagePreview("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !imagePreview) {
      return;
    }

    const newStory: Story = {
      id: crypto.randomUUID(),
      username: username.trim(),
      image: imagePreview,
      caption: caption.trim(),
      createdAt: new Date().toISOString(),
    };

    setStories((current) => [newStory, ...current]);
    setUsername("");
    setCaption("");
    setImagePreview("");
    event.currentTarget.reset();
  }

  const selectedStory = selectedStoryIndex === null ? null : stories[selectedStoryIndex] ?? null;

  function openStory(index: number) {
    setSelectedStoryIndex(index);
    setStoryProgressKey((current) => current + 1);
  }

  function closeStory() {
    setSelectedStoryIndex(null);
  }

  function goToPreviousStory() {
    setSelectedStoryIndex((current) => {
      if (current === null) {
        return null;
      }

      return current <= 0 ? 0 : current - 1;
    });
    setStoryProgressKey((current) => current + 1);
  }

  function goToNextStory() {
    setSelectedStoryIndex((current) => {
      if (current === null) {
        return current;
      }

      return current + 1 >= stories.length ? null : current + 1;
    });
    setStoryProgressKey((current) => current + 1);
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1>Historias de 24 horas</h1>
          <p className="subtitle">
            Sube historias como en Instagram o WhatsApp y ellas expiran automáticamente después de un día.
          </p>
        </div>
      </header>

      <form className="story-form" onSubmit={handleSubmit}>
        <h2>Crear una historia</h2>
        <input
          type="text"
          placeholder="Tu nombre"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <textarea
          placeholder="Escribe un mensaje para tu historia"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />

        {imagePreview ? (
          <img className="preview-image" src={imagePreview} alt="Vista previa de la historia" />
        ) : null}

        <button type="submit">Publicar historia</button>
      </form>

      <section className="stories-section">
        <h2>Historias activas</h2>

        {stories.length === 0 ? (
          <p className="empty-state">No hay historias activas en este momento.</p>
        ) : (
          <div className="stories-container">
            {stories.map((story, index) => (
              <StoryCard key={story.id} story={story} onOpen={() => openStory(index)} />
            ))}
          </div>
        )}
      </section>

      {selectedStory ? (
        <div className="story-viewer" onClick={closeStory}>
          <div className="story-viewer__content" onClick={(event) => event.stopPropagation()}>
            <div className="story-progress" key={storyProgressKey}>
              {stories.map((story, index) => {
                const isCurrent = index === selectedStoryIndex;
                const isPassed = index < (selectedStoryIndex ?? 0);

                return (
                  <div key={story.id} className="story-progress__bar">
                    <div
                      className={`story-progress__fill ${isCurrent ? "active" : isPassed ? "done" : ""}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="story-viewer__header">
              <div>
                <p className="story-viewer__user">{selectedStory.username}</p>
                <p className="story-viewer__time">Ahora</p>
              </div>
              <button type="button" className="story-viewer__close" onClick={closeStory}>
                ✕
              </button>
            </div>

            <img src={selectedStory.image} alt={selectedStory.username} />
            <div className="story-viewer__body">
              <p>{selectedStory.caption || "Sin texto"}</p>
            </div>

            <div className="story-viewer__controls">
              <button type="button" onClick={goToPreviousStory}>
                ←
              </button>
              <button type="button" onClick={goToNextStory}>
                →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Home;