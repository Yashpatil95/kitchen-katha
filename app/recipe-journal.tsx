"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- vinext's Next Link shim currently loads a second React renderer. */

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import type { Recipe, RecipeStatus } from "../db/recipes";
import { splitPastedComments } from "../db/recipe-text.mjs";
import { dataUrlToImageFile, sampleFrameTimes, toggleBoundedSelection } from "../db/video-frames.mjs";

const mealTypes = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Baking",
  "Drinks",
  "Desserts",
  "Sides",
  "Other",
];

const statusLabels: Record<RecipeStatus, string> = {
  "want-to-try": "Want to try",
  tried: "Tried",
  keep: "Keeper",
  "not-for-me": "Not for me",
};

const mealEmoji: Record<string, string> = {
  Breakfast: "☀️",
  Lunch: "🥗",
  Dinner: "🍲",
  Snacks: "🥟",
  Baking: "🥖",
  Drinks: "🫖",
  Desserts: "🍮",
  Sides: "🥣",
  Other: "🍽️",
};

type RecipeDraft = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );

function SpiceLevel({ level }: { level: number }) {
  if (level < 0) return <span className="spice-unknown">Spice not stated</span>;
  return (
    <span className="spice-level" aria-label={`${level} out of 3 spice level`}>
      {[1, 2, 3].map((dot) => (
        <i key={dot} className={dot <= level ? "hot" : ""} />
      ))}
    </span>
  );
}

export function RecipeJournal({ initialRecipes, page }: { initialRecipes: Recipe[]; page: "home" | "recipes" }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [mealFilter, setMealFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [busy, setBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [extractingFrames, setExtractingFrames] = useState(false);
  const [readingImages, setReadingImages] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState<{ src: string; time: number }[]>([]);
  const [selectedFrameTimes, setSelectedFrameTimes] = useState<number[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ id: string; src: string; label: string }[]>([]);
  const [pastedComments, setPastedComments] = useState<string[]>([]);
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [showCaptionFallback, setShowCaptionFallback] = useState(false);
  const [importDraft, setImportDraft] = useState<RecipeDraft | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [message, setMessage] = useState("");
  const formDialog = useRef<HTMLDialogElement>(null);
  const importDialog = useRef<HTMLDialogElement>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const importForm = useRef<HTMLFormElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesText =
        !needle ||
        [recipe.title, recipe.description, recipe.cuisine, recipe.diet, ...recipe.ingredients]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesMeal = mealFilter === "All" || recipe.mealTypes.includes(mealFilter);
      const matchesStatus = statusFilter === "all" || recipe.status === statusFilter;
      return matchesText && matchesMeal && matchesStatus;
    });
  }, [mealFilter, query, recipes, statusFilter]);

  const drawerRecipes = [...filtered].reverse();

  const openForm = (recipe: Recipe | null = null) => {
    setEditing(recipe);
    setImportDraft(null);
    setMissingFields([]);
    setMessage("");
    formDialog.current?.showModal();
  };

  const importRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const caption = String(data.get("instagramCaption") ?? "").trim();
    const transcript = String(data.get("instagramTranscript") ?? "").trim();
    const imageText = String(data.get("instagramImageText") ?? "").trim();
    const commentText = String(data.get("instagramComments") ?? "").trim();
    if (showCaptionFallback && !caption && !transcript && !imageText) {
      setImportMessage("Paste the caption, a narration transcript, or text found in images.");
      return;
    }
    setImportBusy(true);
    try {
      const response = await fetch("/api/import-instagram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: data.get("instagramUrl"), caption, transcript, imageText, commentText }),
      });
      const result = (await response.json()) as {
        recipe?: Recipe;
        alreadySaved?: boolean;
        error?: string;
        canPasteCaption?: boolean;
        draft?: RecipeDraft;
        missing?: string[];
      };
      if (!response.ok || !result.recipe) {
        if (result.draft) {
          setEditing(null);
          setImportDraft(result.draft);
          setMissingFields(result.missing || []);
          setMessage(result.error || "Review the imported details before saving.");
          importDialog.current?.close();
          formDialog.current?.showModal();
          return;
        }
        setShowCaptionFallback(Boolean(result.canPasteCaption));
        throw new Error(result.error || "The recipe could not be imported.");
      }
      if (!result.alreadySaved) setRecipes((current) => [result.recipe!, ...current]);
      setSelected(result.recipe);
      form.reset();
      setVideoThumbnails([]);
      setSelectedFrameTimes([]);
      setImagePreviews([]);
      setPastedComments([]);
      setSelectedComments([]);
      setShowCaptionFallback(false);
      importDialog.current?.close();
      detailDialog.current?.showModal();
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "The recipe could not be imported.");
    } finally {
      setImportBusy(false);
    }
  };

  const transcribeNarrationFile = async () => {
    const form = importForm.current;
    const file = form?.elements.namedItem("narrationFile") as HTMLInputElement | null;
    const consent = form?.elements.namedItem("transcriptionConsent") as HTMLInputElement | null;
    const transcript = form?.elements.namedItem("instagramTranscript") as HTMLTextAreaElement | null;
    const media = document.createElement(file?.files?.[0]?.type.startsWith("video/") ? "video" : "audio");
    const selected = file?.files?.[0];
    if (!selected) return setImportMessage("Choose one audio or video file to transcribe.");
    if (!consent?.checked) return setImportMessage("Confirm that the selected file may be sent for transcription.");
    if (!/^(audio|video)\//.test(selected.type) || selected.size > 20 * 1024 * 1024) {
      return setImportMessage("Choose an audio or video file no larger than 20 MB.");
    }

    setImportMessage("");
    setTranscribing(true);
    const source = URL.createObjectURL(selected);
    try {
      const durationSeconds = await new Promise<number>((resolve, reject) => {
        media.preload = "metadata";
        media.onloadedmetadata = () => resolve(media.duration);
        media.onerror = () => reject(new Error("Kitchen Katha could not read this recording."));
        media.src = source;
      });
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 300) {
        throw new Error("Choose a recording no longer than five minutes.");
      }
      const body = new FormData();
      body.set("file", selected);
      body.set("durationSeconds", String(durationSeconds));
      body.set("creditConsent", "true");
      const response = await fetch("/api/transcribe-narration", { method: "POST", body });
      const result = await response.json() as { transcript?: string; error?: string };
      if (!response.ok || !result.transcript) throw new Error(result.error || "Narration transcription failed.");
      if (transcript) transcript.value = result.transcript;
      file.value = "";
      consent.checked = false;
      setImportMessage("Transcript ready. Review and edit it before adding the recipe.");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Narration transcription failed.");
    } finally {
      URL.revokeObjectURL(source);
      media.removeAttribute("src");
      setTranscribing(false);
    }
  };

  const createVideoThumbnails = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    setVideoThumbnails([]);
    setSelectedFrameTimes([]);
    if (!file) return;
    if (!file.type.startsWith("video/") || file.size > 20 * 1024 * 1024) {
      event.currentTarget.value = "";
      return setImportMessage("Choose a video file no larger than 20 MB.");
    }

    setImportMessage("");
    setExtractingFrames(true);
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const source = URL.createObjectURL(file);
    try {
      video.preload = "metadata";
      video.muted = true;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Kitchen Katha could not read this video."));
        video.src = source;
      });
      if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 300) {
        throw new Error("Choose a video no longer than five minutes.");
      }

      canvas.width = 240;
      canvas.height = Math.max(135, Math.round(240 * video.videoHeight / video.videoWidth));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser cannot create video previews.");
      const thumbnails = [];
      for (const time of sampleFrameTimes(video.duration)) {
        video.currentTime = time;
        await new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error("Kitchen Katha could not read this video."));
        });
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnails.push({ src: canvas.toDataURL("image/jpeg", 0.72), time });
      }
      setVideoThumbnails(thumbnails);
      event.currentTarget.value = "";
      setImportMessage("Local frame previews are ready. Nothing was uploaded.");
    } catch (error) {
      event.currentTarget.value = "";
      setImportMessage(error instanceof Error ? error.message : "Kitchen Katha could not create video previews.");
    } finally {
      URL.revokeObjectURL(source);
      video.removeAttribute("src");
      setExtractingFrames(false);
    }
  };

  const toggleFrame = (time: number) => {
    const next = toggleBoundedSelection(selectedFrameTimes, time, imagePreviews.length);
    if (next === selectedFrameTimes) return setImportMessage("Choose no more than four frames or images in total.");
    setImportMessage("");
    setSelectedFrameTimes(next);
  };

  const createImagePreviews = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.currentTarget.files || [])];
    if (!files.length) return setImagePreviews([]);
    if (files.length + selectedFrameTimes.length > 4 || files.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
      event.currentTarget.value = "";
      return setImportMessage("Choose at most four frames or images in total, with each image no larger than 5 MB.");
    }
    try {
      const previews = await Promise.all(files.map((file, index) => new Promise<{ id: string; src: string; label: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ id: `${file.name}-${file.size}-${file.lastModified}-${index}`, src: String(reader.result), label: file.name });
        reader.onerror = () => reject(new Error("Kitchen Katha could not read one of these images."));
        reader.readAsDataURL(file);
      })));
      setImagePreviews(previews);
      event.currentTarget.value = "";
      setImportMessage("Local image previews are ready. Nothing was uploaded.");
    } catch (error) {
      event.currentTarget.value = "";
      setImagePreviews([]);
      setImportMessage(error instanceof Error ? error.message : "Kitchen Katha could not read these images.");
    }
  };

  const readSelectedImages = async () => {
    const form = importForm.current;
    const consent = form?.elements.namedItem("imageOcrConsent") as HTMLInputElement | null;
    const imageText = form?.elements.namedItem("instagramImageText") as HTMLTextAreaElement | null;
    const frames = selectedFrameTimes.map((time, index) => {
      const preview = videoThumbnails.find((thumbnail) => thumbnail.time === time);
      return preview && dataUrlToImageFile(preview.src, `reel-frame-${index + 1}.jpg`);
    }).filter((file): file is File => Boolean(file));
    const images = imagePreviews.map((preview) => dataUrlToImageFile(preview.src, preview.label));
    const selectedImages = [...frames, ...images];
    if (!selectedImages.length) return setImportMessage("Choose at least one frame or image to read.");
    if (!consent?.checked) return setImportMessage("Confirm that the selected images may be sent for automatic reading.");

    setImportMessage("");
    setReadingImages(true);
    try {
      const body = new FormData();
      selectedImages.forEach((image) => body.append("images", image));
      body.set("creditConsent", "true");
      const response = await fetch("/api/read-images", { method: "POST", body });
      const result = await response.json() as { text?: string; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error || "Automatic image reading failed.");
      if (imageText) imageText.value = result.text;
      consent.checked = false;
      setVideoThumbnails([]);
      setSelectedFrameTimes([]);
      setImagePreviews([]);
      setImportMessage("Image text ready. Review and edit it before adding the recipe.");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Automatic image reading failed.");
    } finally {
      setReadingImages(false);
    }
  };

  const updatePastedComments = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setPastedComments(splitPastedComments(event.currentTarget.value));
    setSelectedComments([]);
  };

  const openRecipe = (recipe: Recipe) => {
    setSelected(recipe);
    detailDialog.current?.showModal();
  };

  const saveRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      title: data.get("title"),
      description: data.get("description"),
      mealTypes: data.getAll("mealTypes"),
      cuisine: data.get("cuisine"),
      diet: data.get("diet"),
      status: data.get("status"),
      spiceLevel: data.get("spiceLevel"),
      prepMinutes: data.get("prepMinutes"),
      cookMinutes: data.get("cookMinutes"),
      servings: data.get("servings"),
      ingredients: String(data.get("ingredients") ?? "").split("\n"),
      steps: String(data.get("steps") ?? "").split("\n"),
      notes: data.get("notes"),
      sourceUrl: data.get("sourceUrl"),
      calories: data.get("calories"),
      proteinGrams: data.get("proteinGrams"),
      fibreGrams: data.get("fibreGrams"),
      lastCookedAt: data.get("lastCookedAt"),
      rating: data.get("rating"),
    };

    try {
      const response = await fetch("/api/recipes", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { recipe?: Recipe; error?: string };
      if (!response.ok || !result.recipe) throw new Error(result.error || "The recipe could not be saved.");

      setRecipes((current) =>
        editing
          ? current.map((recipe) => (recipe.id === result.recipe!.id ? result.recipe! : recipe))
          : [result.recipe!, ...current],
      );
      setSelected(result.recipe);
      formDialog.current?.close();
      setEditing(null);
      setImportDraft(null);
      setMissingFields([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The recipe could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const removeRecipe = async () => {
    if (!selected || !window.confirm(`Remove “${selected.title}” from your recipe box?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/recipes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      if (!response.ok) throw new Error("The recipe could not be removed.");
      setRecipes((current) => current.filter((recipe) => recipe.id !== selected.id));
      detailDialog.current?.close();
      setSelected(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The recipe could not be removed.");
    } finally {
      setBusy(false);
    }
  };

  const editSelected = () => {
    if (!selected) return;
    detailDialog.current?.close();
    openForm(selected);
  };

  const resetFilters = () => {
    setQuery("");
    setMealFilter("All");
    setStatusFilter("all");
  };

  const formRecipe = editing ?? importDraft;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Kitchen Katha home">
          <span className="brand-mark">र</span>
          <span>Kitchen Katha</span>
        </a>
        <nav className="topbar-actions" aria-label="Primary navigation">
          <a className="nav-link" href={page === "home" ? "/recipes" : "/"}>{page === "home" ? "Recipe drawer" : "Home"}</a>
          <a className="nav-link" href="/planner">Meal planner</a>
          <button className="button button-small" onClick={() => openForm()}>
            <span aria-hidden="true">＋</span> Add recipe
          </button>
        </nav>
      </header>

      {page === "home" ? <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Your personal cooking journal</p>
          <h1>Cook it. Note it.<br /><em>Keep the good ones.</em></h1>
          <p className="hero-text">
            A cosy home for every dal you perfect, bake you attempt and chai blend you want to remember.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/recipes">Open recipe drawer <span aria-hidden="true">→</span></a>
            <button className="button button-outline" onClick={() => openForm()}>Add a recipe</button>
          </div>
        </div>
        <div className="hero-board" aria-label="Your recipe box at a glance">
          <div className="sun-shape" />
          <div className="spice-bowl spice-bowl-one"><span>✦</span></div>
          <div className="spice-bowl spice-bowl-two"><span>❋</span></div>
          <div className="hero-card">
            <span className="hero-card-label">This week&apos;s note</span>
            <strong>“Two whistles were plenty.”</strong>
            <span>Rajma masala · 23 Aug</span>
          </div>
          <div className="leaf leaf-one" />
          <div className="leaf leaf-two" />
        </div>
      </section> : (

      <section className="recipe-section" aria-labelledby="recipe-box-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Saved with care</p>
            <h2 id="recipe-box-title">Your recipe box</h2>
          </div>
          <div className="stats" aria-label="Recipe totals">
            <div><strong>{recipes.length}</strong><span>Recipes</span></div>
            <div><strong>{recipes.filter((recipe) => recipe.status === "want-to-try").length}</strong><span>To try</span></div>
            <div><strong>{recipes.filter((recipe) => recipe.status === "keep").length}</strong><span>Keepers</span></div>
          </div>
        </div>

        <dialog className="recipe-dialog import-dialog" ref={importDialog} aria-labelledby="instagram-import-title">
        <form className="instagram-import" ref={importForm} onSubmit={importRecipe}>
          <div className="dialog-header import-copy">
            <span className="import-icon" aria-hidden="true">◎</span>
            <div><strong id="instagram-import-title">Add a recipe from Instagram</strong><p>Paste a public post or reel link. Kitchen Katha will extract the recipe, format it and save the finished card automatically.</p></div>
            <button className="icon-button" type="button" aria-label="Close Instagram importer" onClick={() => importDialog.current?.close()}>×</button>
          </div>
          <div className="import-fields">
            <label className="field"><span className="sr-only">Instagram recipe link</span><input name="instagramUrl" type="url" required placeholder="https://www.instagram.com/reel/…" /></label>
            <button className="button button-primary" disabled={importBusy}>{importBusy ? "Creating card…" : showCaptionFallback ? "Create from text" : "Add to drawer"}</button>
          </div>
          <div className="media-use-note" role="note">
            <strong>Upload media you are allowed to use</strong>
            <span>Choose only saved videos, audio or screenshots you created or have permission to process. Kitchen Katha never asks for Instagram passwords or downloads private posts.</span>
          </div>
          <details className="import-evidence">
            <summary>Recipe is in the Reel narration?</summary>
            <label className="field">Narration transcript
              <textarea name="instagramTranscript" rows={6} maxLength={100000} aria-describedby="narration-help" placeholder={"Recipe title\nIngredients:\n…\nMethod:\n…"} />
            </label>
            <small className="import-limit" id="narration-help">Paste the words spoken in the Reel, with Ingredients and Method headings when possible. This does not transcribe the video or use API credits.</small>
            <div className="transcription-box">
              <label className="field">Or upload saved narration audio/video
                <input name="narrationFile" type="file" accept="audio/*,video/*" aria-describedby="transcription-help" />
              </label>
              <label className="credit-consent"><input name="transcriptionConsent" type="checkbox" /> I understand this sends the selected file to Cloudflare Workers AI for transcription.</label>
              <button className="button button-outline" type="button" disabled={transcribing} onClick={transcribeNarrationFile}>{transcribing ? "Transcribing…" : "Transcribe narration"}</button>
              <small className="import-limit" id="transcription-help">One file, maximum 20 MB and five minutes. This uses Cloudflare&apos;s free daily AI allocation. Nothing is saved automatically; review the transcript before adding the recipe.</small>
            </div>
          </details>
          <details className="import-evidence">
            <summary>Recipe is written in images or comments?</summary>
            <div className="frame-preview-box">
              <label className="field">Upload a saved Reel video for local thumbnails
                <input type="file" accept="video/*" onChange={createVideoThumbnails} aria-describedby="frame-preview-help" />
              </label>
              <small className="import-limit" id="frame-preview-help">One video, maximum 20 MB and five minutes. Kitchen Katha creates six previews in this browser; it does not upload the video or use AI credits.</small>
              {extractingFrames && <p className="frame-preview-status" role="status">Creating local previews…</p>}
              {videoThumbnails.length > 0 && <div className="frame-preview-grid" aria-label="Local video frame previews">
                {videoThumbnails.map((thumbnail, index) => <button className="frame-preview" type="button" key={thumbnail.time} aria-pressed={selectedFrameTimes.includes(thumbnail.time)} onClick={() => toggleFrame(thumbnail.time)}>
                  <img src={thumbnail.src} alt={`Video frame preview ${index + 1}`} />
                  <span>{Math.round(thumbnail.time)}s · {selectedFrameTimes.includes(thumbnail.time) ? "Selected" : "Select"}</span>
                </button>)}
              </div>}
              <label className="field">Or upload saved screenshots or images
                <input type="file" accept="image/*" multiple onChange={createImagePreviews} aria-describedby="image-preview-help" />
              </label>
              <small className="import-limit" id="image-preview-help">Choose up to four images, maximum 5 MB each. Selected frames and uploaded images share one four-image limit and stay in this browser.</small>
              {imagePreviews.length > 0 && <div className="frame-preview-grid" aria-label="Local uploaded image previews">
                {imagePreviews.map((preview) => <figure className="frame-preview" key={preview.id}>
                  <img src={preview.src} alt={preview.label} />
                  <figcaption>{preview.label}</figcaption>
                </figure>)}
              </div>}
              {(selectedFrameTimes.length > 0 || imagePreviews.length > 0) && <p className="frame-preview-status" role="status">{selectedFrameTimes.length + imagePreviews.length} of 4 images ready for optional automatic reading.</p>}
              <div className="ocr-actions">
                <label className="credit-consent"><input name="imageOcrConsent" type="checkbox" /> I understand this sends the selected images to an external image-reading service and may use API credits.</label>
                <button className="button button-outline" type="button" disabled={readingImages || selectedFrameTimes.length + imagePreviews.length === 0} onClick={readSelectedImages}>{readingImages ? "Reading images…" : "Read selected images — uses API credits"}</button>
                <small className="import-limit">One request for up to four images. Returned text is editable and nothing is saved automatically. Automatic reading remains unavailable until a protected provider is configured.</small>
              </div>
            </div>
            <label className="field">Text found in images
              <textarea name="instagramImageText" rows={6} maxLength={50000} aria-describedby="image-text-help" placeholder={"Recipe title\nIngredients:\n…\nMethod:\n…"} />
            </label>
            <small className="import-limit" id="image-text-help">Paste only the recipe words you can see. Kitchen Katha does not inspect the images or use OCR credits.</small>
            <label className="field import-comments">Paste comments, one per line
              <textarea rows={4} maxLength={1500} onChange={updatePastedComments} aria-describedby="comments-help" placeholder={"Reduce the heat after adding yoghurt.\nAdd a splash of water if the masala catches."} />
            </label>
            <input type="hidden" name="instagramComments" value={selectedComments.map((index) => pastedComments[index]).join("\n")} />
            {pastedComments.length > 0 && <fieldset className="comment-picker">
              <legend>Select useful comments</legend>
              {pastedComments.map((comment, index) => <label key={`${index}-${comment}`}>
                <input type="checkbox" checked={selectedComments.includes(index)} onChange={() => setSelectedComments((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])} />
                <span>{comment}</span>
              </label>)}
            </fieldset>}
            <small className="import-limit" id="comments-help">Only selected comments are saved as “Comments (unverified)” in your notes. They never become ingredients or method steps.</small>
          </details>
          {showCaptionFallback && <label className="field import-caption">Paste the Instagram caption
            <textarea name="instagramCaption" rows={8} maxLength={100000} placeholder={"Recipe title\nIngredients for 2:\n…\nHow to make:\n…"} />
          </label>}
          <small className="import-limit">Public captions import automatically. If Instagram blocks retrieval, paste its caption, narration transcript or text found in images and the same formatter will handle it.</small>
          {importMessage && <p className={/^(Transcript|Image text|Local (frame|image) previews) ready\./.test(importMessage) ? "form-error form-success" : "form-error"} role={/^(Transcript|Image text|Local (frame|image) previews) ready\./.test(importMessage) ? "status" : "alert"}>{importMessage}</p>}
        </form>
        </dialog>

        <div className="toolbar">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search recipes</span>
            <input
              type="search"
              placeholder="Search dishes, ingredients, regions…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="select-box">
            <span className="sr-only">Filter by cooking status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All stages</option>
              <option value="want-to-try">Want to try</option>
              <option value="tried">Tried</option>
              <option value="keep">Keepers</option>
              <option value="not-for-me">Not for me</option>
            </select>
          </label>
        </div>

        <div className="filter-row" aria-label="Filter by meal type">
          {["All", ...mealTypes].map((meal) => (
            <button
              key={meal}
              className={mealFilter === meal ? "filter-chip active" : "filter-chip"}
              aria-pressed={mealFilter === meal}
              onClick={() => setMealFilter(meal)}
            >
              {meal}
            </button>
          ))}
        </div>

        {drawerRecipes.length ? (
          <div className="recipe-drawer-shell">
            <div className="drawer-guide">
              <span>Recipe drawer</span>
              <p>{drawerRecipes.length} {drawerRecipes.length === 1 ? "card" : "cards"} filed here · Tap a labelled edge to pull one out</p>
            </div>
            <div className="recipe-drawer" role="list">
            {drawerRecipes.map((recipe, index) => {
              const primaryMeal = recipe.mealTypes[0] || "Other";
              const isFrontCard = index === drawerRecipes.length - 1;
              return (
                <article className={isFrontCard ? "recipe-card drawer-front" : "recipe-card"} id={`recipe-${recipe.id}`} key={recipe.id} role="listitem">
                  <button className="drawer-tab" type="button" onClick={() => openRecipe(recipe)} aria-label={`Pull out ${recipe.title}`}>
                    <span className="drawer-tab-emoji" aria-hidden="true">{mealEmoji[primaryMeal] || "🍽️"}</span>
                    <span className="drawer-tab-copy">
                      <strong>{recipe.title}</strong>
                      <small>{recipe.cuisine} · {primaryMeal}</small>
                    </span>
                    <span className={`drawer-tab-status status-${recipe.status}`}>{statusLabels[recipe.status]}</span>
                    <span className="drawer-tab-arrow" aria-hidden="true">↗</span>
                  </button>
                  <div className="drawer-card-preview" aria-hidden={!isFrontCard}>
                    <div className={`card-art art-${primaryMeal.toLowerCase()}`}>
                      <span className="meal-emoji" aria-hidden="true">{mealEmoji[primaryMeal] || "🍽️"}</span>
                      <span className={`status-badge status-${recipe.status}`}>{statusLabels[recipe.status]}</span>
                      {recipe.rating && <span className="rating-badge">★ {recipe.rating}</span>}
                    </div>
                    <div className="card-content">
                      <div className="card-kicker">
                        <span>{recipe.cuisine}</span>
                        <SpiceLevel level={recipe.spiceLevel} />
                      </div>
                      <h3>{recipe.title}</h3>
                      <p>{recipe.description || "A recipe waiting for your personal notes."}</p>
                      <div className="card-meta">
                        <span>◷ {recipe.prepMinutes > 0 && recipe.cookMinutes > 0 ? `${recipe.prepMinutes + recipe.cookMinutes} min` : "Time not stated"}</span>
                        <span>{recipe.servings > 0 ? `Serves ${recipe.servings}` : "Servings not stated"}</span>
                        <span>{recipe.diet}</span>
                        {recipe.proteinGrams !== null && <span>{recipe.proteinGrams}g protein</span>}
                      </div>
                      <button className="text-button" tabIndex={isFrontCard ? 0 : -1} onClick={() => openRecipe(recipe)}>
                        Pull out this recipe <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            </div>
          </div>
        ) : recipes.length ? (
          <div className="empty-state">
            <span aria-hidden="true">🥄</span>
            <h3>No recipes match those filters</h3>
            <p>Try another ingredient or clear the filters.</p>
            <button className="button button-outline" onClick={resetFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="empty-state first-recipe">
            <span aria-hidden="true">📖</span>
            <h3>Your recipe box is ready</h3>
            <p>Add the first dish you want to try, then come back after cooking to record what worked.</p>
            <button className="button button-primary" onClick={() => openForm()}>Add a recipe</button>
          </div>
        )}
      </section>
      )}

      <footer>
        <span className="brand-mark">र</span>
        <p>Made for recipes worth repeating.</p>
      </footer>

      <dialog className="recipe-dialog form-dialog" ref={formDialog} onClose={() => { setEditing(null); setImportDraft(null); setMissingFields([]); }}>
        <form key={editing?.id ?? (importDraft ? `import-${importDraft.sourceUrl}` : "new")} onSubmit={saveRecipe}>
          <div className="dialog-header">
            <div>
              <p className="eyebrow"><span /> {editing ? "Refine your notes" : "A new kitchen memory"}</p>
              <h2>{editing ? "Edit recipe" : "Add a recipe"}</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Close" onClick={() => formDialog.current?.close()}>×</button>
          </div>

          {page === "recipes" && !editing && !importDraft && <aside className="instagram-choice">
            <span className="import-icon" aria-hidden="true">◎</span>
            <div><strong>Adding a recipe from Instagram?</strong><p>Paste the Reel or post link and let Kitchen Katha prepare the card for you.</p></div>
            <button className="button button-outline" type="button" onClick={() => { formDialog.current?.close(); importDialog.current?.showModal(); }}>Import link</button>
          </aside>}

          <div className="form-grid">
            <label className={`field field-wide ${missingFields.includes("title") ? "field-missing" : ""}`}>Recipe name
              <input name="title" required maxLength={120} defaultValue={formRecipe?.title} placeholder="e.g. Aai’s Sunday poha" />
            </label>
            <label className="field field-wide">Short description
              <textarea name="description" rows={2} maxLength={400} defaultValue={formRecipe?.description} placeholder="What makes this version special?" />
            </label>

            <fieldset className="field field-wide check-group">
              <legend>Where does it fit?</legend>
              <div>
                {mealTypes.map((meal) => (
                  <label key={meal}>
                    <input type="checkbox" name="mealTypes" value={meal} defaultChecked={formRecipe ? formRecipe.mealTypes?.includes(meal) : meal === "Dinner"} />
                    <span>{meal}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field">Cuisine or region
              <input name="cuisine" maxLength={60} defaultValue={formRecipe?.cuisine ?? "Indian"} placeholder="Maharashtrian" />
            </label>
            <label className="field">Diet
              <select name="diet" defaultValue={formRecipe?.diet ?? "Vegetarian"}>
                <option>Unknown</option><option>Vegetarian</option><option>Vegan</option><option>Jain</option><option>Egg</option><option>Chicken</option><option>Seafood</option><option>Mutton</option><option>Other</option>
              </select>
            </label>
            <label className="field">Cooking stage
              <select name="status" defaultValue={formRecipe?.status ?? "want-to-try"}>
                <option value="want-to-try">Want to try</option><option value="tried">Tried</option><option value="keep">Keeper</option><option value="not-for-me">Not for me</option>
              </select>
            </label>
            <label className="field">Spice level
              <select name="spiceLevel" defaultValue={formRecipe?.spiceLevel ?? 2}>
                <option value="-1">Not stated</option><option value="0">No heat</option><option value="1">Mild</option><option value="2">Medium</option><option value="3">Hot</option>
              </select>
            </label>
            <label className="field">Prep minutes
              <input name="prepMinutes" type="number" min="0" max="1440" defaultValue={formRecipe?.prepMinutes ?? 10} />
            </label>
            <label className="field">Cook minutes
              <input name="cookMinutes" type="number" min="0" max="1440" defaultValue={formRecipe?.cookMinutes ?? 25} />
            </label>
            <label className="field">Servings
              <input name="servings" type="number" min="0" max="100" defaultValue={formRecipe?.servings ?? 2} />
              <small>Use 0 when the source does not say.</small>
            </label>
            <label className="field">Last cooked
              <input name="lastCookedAt" type="date" defaultValue={formRecipe?.lastCookedAt ?? ""} />
            </label>

            <label className={`field field-wide ${missingFields.includes("ingredients") ? "field-missing" : ""}`}>Ingredients <small>One per line</small>
              <textarea name="ingredients" required rows={7} defaultValue={formRecipe?.ingredients?.join("\n")} placeholder={"1 cup toor dal\n2 tomatoes, chopped\n1 tsp cumin seeds"} />
            </label>
            <label className={`field field-wide ${missingFields.includes("steps") ? "field-missing" : ""}`}>Method <small>One step per line</small>
              <textarea name="steps" required rows={8} defaultValue={formRecipe?.steps?.join("\n")} placeholder={"Rinse and soak the dal for 20 minutes.\nPressure cook for 3 whistles.\nFinish with a hot cumin tadka."} />
            </label>
            <label className="field field-wide">Kitchen notes
              <textarea name="notes" rows={4} maxLength={2000} defaultValue={formRecipe?.notes} placeholder="Substitutions, flame level, pressure-cooker whistles, or what you would change next time…" />
            </label>
            <label className="field field-wide">Original recipe link
              <input name="sourceUrl" type="url" maxLength={500} defaultValue={formRecipe?.sourceUrl} placeholder="Instagram, blog or video link" />
            </label>
            <div className="field field-wide nutrition-heading"><strong>Nutrition per serving</strong><small>Optional — add values from a trusted label or calculation so the meal planner can compare recipes.</small></div>
            <label className="field">Energy (kcal)
              <input name="calories" type="number" min="0" max="10000" defaultValue={formRecipe?.calories ?? ""} />
            </label>
            <label className="field">Protein (g)
              <input name="proteinGrams" type="number" min="0" max="500" defaultValue={formRecipe?.proteinGrams ?? ""} />
            </label>
            <label className="field">Fibre (g)
              <input name="fibreGrams" type="number" min="0" max="200" defaultValue={formRecipe?.fibreGrams ?? ""} />
            </label>
            <label className="field">Your rating
              <select name="rating" defaultValue={formRecipe?.rating ?? ""}>
                <option value="">Not rated yet</option><option value="1">★</option><option value="2">★★</option><option value="3">★★★</option><option value="4">★★★★</option><option value="5">★★★★★</option>
              </select>
            </label>
          </div>

          {message && <p className="form-error" role="alert">{message}</p>}
          <div className="dialog-actions">
            <button className="button button-quiet" type="button" onClick={() => formDialog.current?.close()}>Cancel</button>
            <button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save recipe"}</button>
          </div>
        </form>
      </dialog>

      <dialog className="recipe-dialog detail-dialog" ref={detailDialog} aria-modal="true" aria-labelledby="recipe-detail-title" onClose={() => setSelected(null)}>
        {selected && (
          <article>
            <div className={`detail-hero art-${(selected.mealTypes[0] || "Other").toLowerCase()}`}>
              <span className="meal-emoji" aria-hidden="true">{mealEmoji[selected.mealTypes[0]] || "🍽️"}</span>
              <button className="icon-button light" aria-label="Close" onClick={() => detailDialog.current?.close()}>×</button>
              <span className={`status-badge status-${selected.status}`}>{statusLabels[selected.status]}</span>
            </div>
            <div className="detail-body">
              <p className="card-kicker"><span>{selected.cuisine} · {selected.diet}</span><SpiceLevel level={selected.spiceLevel} /></p>
              <h2 id="recipe-detail-title">{selected.title}</h2>
              {selected.description && <p className="detail-description">{selected.description}</p>}
              <div className="detail-facts">
                <span>{selected.prepMinutes > 0 ? <><b>{selected.prepMinutes}</b> min prep</> : <b>Prep not stated</b>}</span>
                <span>{selected.cookMinutes > 0 ? <><b>{selected.cookMinutes}</b> min cook</> : <b>Cook not stated</b>}</span>
                <span>{selected.servings > 0 ? <><b>{selected.servings}</b> servings</> : <b>Servings not stated</b>}</span>
                {selected.calories !== null && <span><b>{selected.calories}</b> kcal</span>}
                {selected.proteinGrams !== null && <span><b>{selected.proteinGrams}g</b> protein</span>}
                {selected.fibreGrams !== null && <span><b>{selected.fibreGrams}g</b> fibre</span>}
                {selected.rating && <span><b>★ {selected.rating}</b> rating</span>}
              </div>
              <div className="recipe-columns">
                <section>
                  <h3>Ingredients</h3>
                  <ul>{selected.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul>
                </section>
                <section>
                  <h3>Method</h3>
                  <ol>{selected.steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol>
                </section>
              </div>
              {selected.notes && <aside className="kitchen-note"><strong>From your kitchen notebook</strong><p>{selected.notes}</p></aside>}
              {selected.sourceUrl && <p className="recipe-source"><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open the original recipe <span aria-hidden="true">↗</span></a></p>}
              {selected.lastCookedAt && <p className="last-cooked">Last cooked {dateLabel(selected.lastCookedAt)}</p>}
              <div className="dialog-actions detail-actions">
                <button className="button danger-button" type="button" disabled={busy} onClick={removeRecipe}>Remove</button>
                <button className="button button-outline" type="button" onClick={editSelected}>Edit notes</button>
              </div>
            </div>
          </article>
        )}
      </dialog>
    </main>
  );
}
