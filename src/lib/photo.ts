const MAX_EDGE = 1200;

function isHeic(file: File) {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    if (!isHeic(file)) {
      throw new Error("That photo format isn’t supported. Use a JPG or PNG.");
    }
  }
  try {
    const { heicTo } = await import("heic-to");
    const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.85 });
    return await createImageBitmap(jpeg);
  } catch {
    throw new Error("Couldn’t read that iPhone photo. Save it as a JPG or PNG and try again.");
  }
}

/** Shrink a photo and store it as a JPEG the browser can actually display. */
export async function fileToJpegDataUrl(file: File): Promise<string> {
  const bitmap = await decode(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read that photo.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const url = canvas.toDataURL("image/jpeg", 0.85);
    if (!url.startsWith("data:image/jpeg")) {
      throw new Error("Could not read that photo. Use a JPG or PNG.");
    }
    return url;
  } finally {
    bitmap.close();
  }
}
