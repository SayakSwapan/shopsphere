"use client";

import Image from "next/image";

import {
  UploadCloud,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  useState,
} from "react";

interface Props {
  images: string[];

  setImages: (
    images: string[]
  ) => void;
}

export default function ProductImagesUpload({
  images,
  setImages,
}: Props) {
  const [uploading, setUploading] =
    useState(false);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files =
      e.target.files;

    if (!files) return;

    if (
      images.length +
        files.length >
      5
    ) {
      alert(
        "Maximum 5 images allowed"
      );

      return;
    }

    try {
      setUploading(true);

      const uploaded =
        [...images];

      for (
        let i = 0;
        i < files.length;
        i++
      ) {
        const formData =
          new FormData();

        formData.append(
          "file",
          files[i]
        );

        const response =
          await fetch(
            "/api/upload",
            {
              method: "POST",

              body: formData,
            }
          );

        const data =
          await response.json();

        if (
          data.success &&
          data.url
        ) {
          uploaded.push(
            data.url
          );
        }
      }

      setImages(uploaded);
    } catch {
      alert(
        "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  function removeImage(
    index: number
  ) {
    const filtered =
      images.filter(
        (_, i) =>
          i !== index
      );

    setImages(filtered);
  }

  return (
    <div className="space-y-5">
      {/* UPLOAD BOX */}

      <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 bg-slate-50 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center">
            {uploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <UploadCloud size={30} />
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold">
          Upload Product Images
        </h2>

        <p className="text-slate-500 mt-2">
          Minimum 1 image required
        </p>

        <p className="text-slate-500">
          Maximum 5 images allowed
        </p>

        <label className="inline-flex mt-6 cursor-pointer bg-black text-white px-6 py-3 rounded-2xl">
          Select Images

          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={
              handleUpload
            }
          />
        </label>
      </div>

      {/* IMAGE PREVIEW */}

      {images.length >
        0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Uploaded Images
            </h3>

            <p className="text-sm text-slate-500">
              {
                images.length
              }
              /5 uploaded
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {images
              .filter(
                Boolean
              )
              .map(
                (
                  image,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="relative rounded-xl overflow-hidden border bg-white shadow-sm"
                  >
                    <Image
                      src={image}
                      alt="Product"
                      width={400}
                      height={400}
                      className="w-full h-32 object-cover"
                    />

                    {index ===
                      0 && (
                      <div className="absolute top-2 left-2 bg-black text-white text-[10px] px-2 py-1 rounded-md">
                        Thumbnail
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          index
                        )
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              )}
          </div>
        </div>
      )}
    </div>
  );
}