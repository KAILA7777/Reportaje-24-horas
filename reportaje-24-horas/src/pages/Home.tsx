import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import StoryCard from "../components/StoryCard";
import { initialStories } from "../data";
import type { Story } from "../types/story";

const STORAGE_KEY = "stories-24h";
const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const STORY_VIEW_DURATION_MS = 4000;

type ComposerMode = "text" | "video" | null;

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
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [storyProgressKey, setStoryProgressKey] = useState(0);
  const [showComposerMenu, setShowComposerMenu] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>(null);

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
  }, [selectedStoryIndex, stories.length]);

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setMediaPreview("");
      setMediaType("image");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");

    if (isVideo) {
      setMediaPreview(URL.createObjectURL(file));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  }

  function resetComposer() {
    setUsername("");
    setCaption("");
    setMediaPreview("");
    setMediaType("image");
    setComposerMode(null);
    setShowComposerMenu(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || (!caption.trim() && !mediaPreview)) {
      return;
    }

    const placeholderImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#128c7e"/><circle cx="300" cy="260" r="96" fill="#25d366"/><rect x="118" y="420" width="364" height="140" rx="24" fill="white" opacity="0.2"/><text x="300" y="500" text-anchor="middle" fill="white" font-size="34" font-family="Arial">${caption.trim() || "Nueva historia"}</text></svg>`,
    )}`;

    const newStory: Story = {
      id: crypto.randomUUID(),
      username: username.trim(),
      image: mediaPreview || placeholderImage,
      caption: caption.trim(),
      mediaType: mediaPreview && mediaType === "video" ? "video" : "image",
      createdAt: new Date().toISOString(),
    };

    setStories((current) => [newStory, ...current]);
    resetComposer();
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

  function openComposer(mode: "text" | "video") {
    setComposerMode(mode);
    setShowComposerMenu(false);
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1>Historias de 24 horas</h1>
          <p className="subtitle">
            Sube historias como en WhatsApp y ellas expiran automáticamente después de un día.
          </p>
        </div>
      </header>

      <section className="stories-section">
        <div className="stories-section__top">
          <h2>Historias activas</h2>
          <span>{stories.length} en vivo</span>
        </div>

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

      <div className="composer-shell">
        <button
          type="button"
          className="wa-fab"
          onClick={() => setShowComposerMenu((current) => !current)}
          aria-label="Abrir opciones de historia"
        >
          +
        </button>

        {showComposerMenu ? (
          <div className="wa-menu">
            <button type="button" className="wa-menu__button" onClick={() => openComposer("video")}>
              🎥 Subir video
            </button>
            <button type="button" className="wa-menu__button" onClick={() => openComposer("text")}>
              💬 Texto
            </button>
          </div>
        ) : null}
      </div>

      {composerMode ? (
        <div className="composer-modal" role="dialog" aria-modal="true">
          <div className="composer-card">
            <div className="composer-card__header">
              <div>
                <p className="eyebrow">Nueva historia</p>
                <h3>{composerMode === "video" ? "Subir video" : "Escribir texto"}</h3>
              </div>
              <button type="button" className="composer-card__close" onClick={resetComposer}>
                ✕
              </button>
            </div>

            <form className="story-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tu nombre"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
              <textarea
                placeholder={composerMode === "video" ? "Añade un mensaje a tu video" : "Escribe un mensaje para tu historia"}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />

              {composerMode === "video" ? (
                <input type="file" accept="video/*,image/*" onChange={handleMediaChange} />
              ) : null}

              {mediaPreview ? (
                mediaType === "video" ? (
                  <video className="preview-media" controls src={mediaPreview} />
                ) : (
                  <img className="preview-image" src={mediaPreview} alt="Vista previa de la historia" />
                )
              ) : null}

              <button type="submit">{composerMode === "video" ? "Publicar video" : "Publicar texto"}</button>
            </form>
          </div>
        </div>
      ) : null}

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

            {selectedStory.mediaType === "video" ? (
              <video className="story-viewer__media" controls src={selectedStory.image} />
            ) : (
              <img src={selectedStory.image} alt={selectedStory.username} />
            )}
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