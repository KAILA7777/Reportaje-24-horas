import { useEffect, useRef, useState, type ChangeEvent } from "react";
import StoryCard from "../components/StoryCard";
import { initialStories } from "../data";
import type { Story } from "../types/story";

const STORAGE_KEY = "stories-24h";
const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const STORY_VIEW_DURATION_MS = 3000;
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;

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
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [storyProgressKey, setStoryProgressKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const touchStartX = useRef<number | null>(null);

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

  function resizeImageToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const scale = Math.min(1, MAX_WIDTH / image.naturalWidth, MAX_HEIGHT / image.naturalHeight);
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("No se pudo preparar la imagen"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || "image/jpeg", 0.9));
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("No se pudo leer la imagen"));
      };

      image.src = objectUrl;
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    setIsUploading(true);

    try {
      const base64Image = await resizeImageToBase64(file);
      const newStory: Story = {
        id: crypto.randomUUID(),
        username: "Tú",
        image: base64Image,
        caption: "Nueva historia",
        createdAt: new Date().toISOString(),
      };

      setStories((current) => [newStory, ...current]);
      setSelectedStoryIndex(0);
      setStoryProgressKey((current) => current + 1);
    } catch {
      setIsUploading(false);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
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

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX ?? null;
    if (start === null || end === null) {
      return;
    }

    const delta = start - end;
    if (delta > 50) {
      goToNextStory();
    } else if (delta < -50) {
      goToPreviousStory();
    }
    touchStartX.current = null;
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1>Historias de 24 horas</h1>
          <p className="subtitle">
            Sube una imagen, guárdala en tu dispositivo y compártela como una historia efímera.
          </p>
        </div>
      </header>

      <section className="stories-section">
        <div className="stories-section__top">
          <h2>Historias</h2>
          <span>{stories.length} activas</span>
        </div>

        <div className="stories-list">
          <button type="button" className="story-upload" onClick={() => fileInputRef.current?.click()}>
            <span>+</span>
            <small>Agregar</small>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          {stories.map((story, index) => (
            <StoryCard key={story.id} story={story} onOpen={() => openStory(index)} />
          ))}
        </div>

        {isUploading ? <p className="uploading-state">Procesando imagen…</p> : null}
      </section>

      {selectedStory ? (
        <div className="story-viewer" onClick={closeStory}>
          <div
            className="story-viewer__content"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
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