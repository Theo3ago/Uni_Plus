"use client";

/* eslint-disable @next/next/no-img-element -- local data: URLs */
import { ImagePlus, Star, X } from "lucide-react";
import { useId, useState } from "react";
import { Spinner } from "@/components/ui/States";
import { compressImage } from "@/lib/image";
import { t } from "@/lib/strings";

const MAX = 4;
const s = t.onboarding.photos;

export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const inputId = useId();
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).slice(0, MAX - photos.length);
    setBusy(list.length);
    const added: string[] = [];
    for (const f of list) {
      try {
        added.push(await compressImage(f));
      } catch {
        setError(s.error);
      }
      setBusy((b) => b - 1);
    }
    onChange([...photos, ...added].slice(0, MAX));
  }

  const remove = (i: number) => onChange(photos.filter((_, j) => j !== i));
  const makeMain = (i: number) => onChange([photos[i], ...photos.filter((_, j) => j !== i)]);

  const slots = Array.from({ length: MAX }, (_, i) => i);
  const firstEmpty = photos.length + busy;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3">
        {slots.map((i) => {
          const src = photos[i];
          if (src) {
            return (
              <li key={i} className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-navy-50 shadow-soft">
                <img src={src} alt={s.alt(i + 1)} className="h-full w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute bottom-2 left-2 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-navy">
                    {s.main}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeMain(i)}
                    aria-label={`${s.makeMain} (${s.alt(i + 1)})`}
                    className="absolute bottom-1 left-1 flex h-11 w-11 items-center justify-center"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-navy shadow-soft">
                      <Star className="h-4 w-4" aria-hidden />
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`${s.remove} ${i + 1}`}
                  className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-navy shadow-soft">
                    <X className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </li>
            );
          }
          if (i < firstEmpty) {
            return (
              <li
                key={i}
                className="flex aspect-[3/4] items-center justify-center rounded-[20px] border border-line bg-card"
              >
                <Spinner label={s.processing} />
              </li>
            );
          }
          return (
            <li key={i}>
              <label
                htmlFor={inputId}
                className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed text-sm font-medium transition-colors ${
                  i === firstEmpty
                    ? "border-navy/30 bg-card text-navy hover:bg-navy-50"
                    : "border-line bg-transparent text-ink-2"
                }`}
              >
                <ImagePlus className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                {i === firstEmpty ? s.add : null}
              </label>
            </li>
          );
        })}
      </ul>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={photos.length + busy >= MAX}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {error ? (
        <p role="alert" className="mt-3 text-sm text-navy">
          {error}
        </p>
      ) : null}
    </div>
  );
}
