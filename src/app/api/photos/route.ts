import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import heicConvert from "heic-convert";
import { requireAdmin } from "@/lib/session";

const HEIC_EXTENSIONS = new Set(["heic", "heif"]);
const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

function isHeic(file: File): boolean {
  if (HEIC_MIME_TYPES.has(file.type.toLowerCase())) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && HEIC_EXTENSIONS.has(ext);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin required." }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo storage is not configured." },
      { status: 500 }
    );
  }

  let uploadBody: Blob | File = file;
  let ext = file.name.split(".").pop() || "jpg";

  // iPhones default to capturing photos as HEIC/HEIF, which most browsers
  // other than Safari can't render via a plain <img>. Convert to JPEG
  // server-side before it ever reaches Blob storage, so we never rely on
  // client/browser HEIC support.
  if (isHeic(file)) {
    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.85,
      });
      uploadBody = new Blob([new Uint8Array(outputBuffer)], {
        type: "image/jpeg",
      });
      ext = "jpg";
    } catch (err) {
      console.error("HEIC conversion failed:", err);
      return NextResponse.json(
        { error: `Could not convert "${file.name}" from HEIC — file was not uploaded.` },
        { status: 422 }
      );
    }
  }

  const key = `entries/${nanoid()}.${ext}`;

  const blob = await put(key, uploadBody, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
