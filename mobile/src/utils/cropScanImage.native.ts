import { Image } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

type Rect = { x: number; y: number; width: number; height: number };
type Size = { width: number; height: number };

export async function cropScanImage(
  imageUri: string,
  preview: Size,
  frame: Rect,
): Promise<string> {
  if (!imageUri.trim()) {
    throw new Error("No photo was provided.");
  }
  if (![preview.width, preview.height].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error("Camera preview is not ready.");
  }
  if (
    ![frame.x, frame.y, frame.width, frame.height].every(Number.isFinite) ||
    frame.width <= 0 || frame.height <= 0
  ) {
    throw new Error("Scan frame is not ready.");
  }

    const { width, height } = await new Promise<Size>((resolve, reject) => {
      Image.getSize(imageUri.trim(), (width, height) => resolve({ width, height }), reject);
    });
    if (width <= 0 || height <= 0) {
      throw new Error("Unable to load photo.");
    }

    // Map the centered, cover-scaled preview to the decoded capture, as on web.
    const scale = Math.max(preview.width / width, preview.height / height);
    const offsetX = (width * scale - preview.width) / 2;
    const offsetY = (height * scale - preview.height) / 2;
    const originX = Math.max(0, Math.floor((frame.x + offsetX) / scale));
    const originY = Math.max(0, Math.floor((frame.y + offsetY) / scale));
    const right = Math.min(width, Math.ceil((frame.x + frame.width + offsetX) / scale));
    const bottom = Math.min(height, Math.ceil((frame.y + frame.height + offsetY) / scale));
    if (right <= originX || bottom <= originY) {
      throw new Error("Scan frame is outside the photo.");
    }

    const result = await manipulateAsync(
      imageUri.trim(),
      [{ crop: { originX, originY, width: right - originX, height: bottom - originY } }],
      { format: SaveFormat.JPEG, compress: 0.9 },
    );
    return result.uri;
}
