"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ImageUpload({
  images,
  setImages,
}: Props) {
  async function upload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = e.target.files;

    if (!files) return;

    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed.");
      return;
    }

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const form = new FormData();

          form.append("file", file);

          // Signed, server-side upload via /api/upload (uses the
          // Cloudinary API secret) — no dependency on an unsigned preset.
          const res = await fetch("/api/upload", {
            method: "POST",
            body: form,
          });

          const result = await res.json();

          if (!res.ok || !result.url) {
            throw new Error(
              result.message || "Upload failed"
            );
          }

          return result.url as string;
        })
      );

      setImages((prev) => [...prev, ...uploaded]);

      toast.success("Images uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Image upload failed");
    }

    e.target.value = "";
  }

  function remove(index: number) {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-white">
              Product Images
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {images.length}/5 Images Uploaded
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The first image becomes the cover. Max 5 images. Supported: JPG, PNG, WebP.
            </p>
          </div>

        <label className="cursor-pointer rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400">

          Upload Images

          <input
            hidden
            multiple
            type="file"
            accept="image/*"
            onChange={upload}
          />

        </label>

      </div>

      {/* Images */}

      <div className="grid grid-cols-12 gap-6">

        {/* Cover */}

        <div className="col-span-7">

          <p className="mb-3 text-sm font-semibold text-slate-300">
            Cover Image
          </p>

          <div className="relative h-[240px] overflow-hidden rounded-xl border border-slate-700 bg-[#0F172A]">

            {images.length ? (
              <>
                <Image
                  src={images[0]}
                  alt=""
                  fill
                  className="object-contain p-3"
                />

                <span className="absolute left-3 top-3 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-black">
                  COVER
                </span>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-500">

                <Upload size={42} />

                <span className="mt-3">
                  No Cover Image
                </span>

              </div>
            )}

          </div>

        </div>

        {/* Gallery */}

        <div className="col-span-5">

          <p className="mb-3 text-sm font-semibold text-slate-300">
            Gallery
          </p>

          <div className="grid grid-cols-2 gap-4">

            {images.map((image, index) => (

              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-700 bg-[#0F172A]"
              >

                <Image
  src={image}
  alt="Product"
  width={160}
  height={160}
  className="h-full w-full object-cover"
/>

                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute right-2 top-2 hidden rounded-full bg-red-500 p-1 text-white group-hover:flex"
                  >
                    <X size={14} />
                  </button>
                )}

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold text-black">
                    COVER
                  </span>
                )}

              </div>

            ))}

            {/* Empty Slots */}

            {images.length < 5 &&
              Array.from({
                length: 5 - images.length,
              }).map((_, index) => (

                <label
                  key={index}
                  className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-[#0F172A] transition hover:border-amber-400 hover:bg-slate-800"
                >

                  <Upload
                    size={30}
                    className="text-slate-500"
                  />

                  <input
                    hidden
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={upload}
                  />

                </label>

              ))}

          </div>

        </div>

      </div>

    </div>
  );
}