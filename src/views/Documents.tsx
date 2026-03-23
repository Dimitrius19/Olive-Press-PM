import { useState, useMemo, useRef, useCallback } from "react";
import { useDocuments, useUploadDocument } from "../hooks/useDocuments";
import { supabase } from "../lib/supabase";
import type { Document } from "../lib/types";

type CategoryTab = "all" | Document["category"];

const TABS: { label: string; value: CategoryTab }[] = [
  { label: "All", value: "all" },
  { label: "Permits", value: "permit" },
  { label: "Studies", value: "study" },
  { label: "Plans", value: "plan" },
  { label: "Photos", value: "photo" },
  { label: "Reports", value: "report" },
  { label: "Contracts", value: "contract" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPreviewUrl(filePath: string): string {
  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
  return data.publicUrl;
}

export function Documents() {
  const [tab, setTab] = useState<CategoryTab>("all");
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs, isLoading, error } = useDocuments(
    tab === "all" ? undefined : tab,
  );
  const upload = useUploadDocument();

  const filtered = useMemo(() => {
    if (!docs) return [];
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [docs, search]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const category: Document["category"] = file.type.startsWith("image/")
          ? "photo"
          : "report";
        upload.mutate({
          file,
          meta: {
            title: file.name.replace(/\.[^.]+$/, ""),
            category,
            uploaded_by: "Dashboard User",
            tags: [],
          },
        });
      });
    },
    [upload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  if (isLoading) return <p className="text-stone-400">Loading documents...</p>;
  if (error)
    return (
      <p className="text-red-500">
        Failed to load documents: {(error as Error).message}
      </p>
    );

  const isImage = (mime: string) => mime.startsWith("image/");
  const isPdf = (mime: string) => mime === "application/pdf";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-800">Documents</h2>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              tab === t.value
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Upload */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or tag..."
          className="flex-1 min-w-[200px] border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
        >
          Upload File
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-stone-200 bg-stone-50"
        }`}
      >
        <p className="text-sm text-stone-400">
          {upload.isPending
            ? "Uploading..."
            : "Drag and drop files here to upload"}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200 text-[11px] text-stone-400 uppercase">
              <th className="py-2 px-4 text-left font-medium">Title</th>
              <th className="py-2 px-3 text-left font-medium">Category</th>
              <th className="py-2 px-3 text-right font-medium">Size</th>
              <th className="py-2 px-3 text-left font-medium">Uploaded</th>
              <th className="py-2 px-3 text-left font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
              >
                <td className="py-2 px-4 text-sm text-stone-700 font-medium">
                  {doc.title}
                </td>
                <td className="py-2 px-3 text-xs text-stone-500 capitalize">
                  {doc.category}
                </td>
                <td className="py-2 px-3 text-xs text-stone-400 text-right">
                  {formatBytes(doc.file_size)}
                </td>
                <td className="py-2 px-3 text-xs text-stone-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="py-2 px-3 text-xs text-stone-400">
                  {doc.uploaded_by}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="relative py-16 flex flex-col items-center justify-center overflow-hidden">
            <img
              src="/hotel-view.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.07]"
            />
            <p className="relative text-stone-500 text-sm font-medium">
              Upload project documents to get started
            </p>
            <p className="relative text-stone-400 text-xs mt-1">
              Permits, studies, plans, and contracts — all in one place
            </p>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-800">
                {previewDoc.title}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-stone-400 hover:text-stone-600 text-xl"
              >
                &times;
              </button>
            </div>
            {isImage(previewDoc.mime_type) ? (
              <img
                src={getPreviewUrl(previewDoc.file_path)}
                alt={previewDoc.title}
                className="w-full rounded-lg"
              />
            ) : isPdf(previewDoc.mime_type) ? (
              <iframe
                src={getPreviewUrl(previewDoc.file_path)}
                title={previewDoc.title}
                className="w-full h-[70vh] rounded-lg border"
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-stone-500 mb-4">
                  Preview not available for this file type.
                </p>
                <a
                  href={getPreviewUrl(previewDoc.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
