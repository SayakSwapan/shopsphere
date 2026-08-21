import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

interface CloudinaryUploadResult {
  secure_url: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFolder(raw: string): string {
  const cleaned = raw
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

  // Restrict to safe path characters.
  return cleaned.replace(/[^A-Za-z0-9/_-]/g, "");
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const rawFolder =
      (formData.get("folder") as string) || "shopsphere/products";
    const folder = sanitizeFolder(rawFolder) || "shopsphere/products";

    if (!file) {
      return NextResponse.json({ message: "No File" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, WebP, GIF or AVIF images are allowed." },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder }, (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error);
            return;
          }
          resolve({ secure_url: uploadResult.secure_url });
        })
        .end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("CLOUDINARY UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Upload Failed" }, { status: 500 });
  }
}