import { useState, useMemo, useRef, useCallback } from "react";
import { useDocuments, useUploadDocument } from "../hooks/useDocuments";
import { supabase } from "../lib/supabase";
import type { Document } from "../lib/types";

const PHOTO_TAGS = [
  "All",
  "Site Conditions",
  "Demolition",
  "Construction Progress",
  "Finishes",
  "Before/After",
  "Masterplan",
] as const;

function getPhotoUrl(filePath: string): string {
  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
  return data.publicUrl;
}

export function Gallery() {
  const { data: photos, isLoading, error } = useDocuments("photo");
  const upload = useUploadDocument();
  const [activeTag, setActiveTag] = useState<string>("All");
  const [lightboxDoc, setLightboxDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!photos) return [];
    if (activeTag === "All") return photos;
    return photos.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()),
    );
  }, [photos, activeTag]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        upload.mutate({
          file,
          meta: {
            title: file.name.replace(/\.[^.]+$/, ""),
            category: "photo",
            uploaded_by: "Dashboard User",
            tags: [],
          },
        });
      });
    },
    [upload],
  );

  if (isLoading) return <p className="text-stone-400">Loading gallery...</p>;
  if (error)
    return (
      <p className="text-red-500">
        Failed to load gallery: {(error as Error).message}
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-stone-800">Photo Gallery</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
          >
            Upload Photos
          </button>
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        {PHOTO_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTag === tag
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <div className="relative rounded-2xl overflow-hidden py-20 flex flex-col items-center justify-center">
          <img
            src="/aegean-coast.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-10"
          />
          <p className="relative text-stone-500 text-sm font-medium">
            Capture the renovation journey — upload site photos
          </p>
          <p className="relative text-stone-400 text-xs mt-1">
            Document progress from demolition to finishing touches
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxDoc(photo)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-200"
            >
              <img
                src={getPhotoUrl(photo.file_path)}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {photo.title}
                </p>
                <p className="text-white/70 text-xs">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxDoc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxDoc(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxDoc(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl"
            >
              &times;
            </button>
            <img
              src={getPhotoUrl(lightboxDoc.file_path)}
              alt={lightboxDoc.title}
              className="w-full rounded-xl"
            />
            <div className="mt-3 text-center">
              <p className="text-white font-medium">{lightboxDoc.title}</p>
              <p className="text-white/60 text-sm">
                {new Date(lightboxDoc.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
