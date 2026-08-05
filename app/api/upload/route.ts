import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

interface CloudinaryUploadResult {
  secure_url: string;
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
    const folder = (formData.get("folder") as string) || "shopsphere/products";

    if (!file) {
      return NextResponse.json({ message: "No File" }, { status: 400 });
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