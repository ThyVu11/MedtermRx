type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Size = {
  width: number;
  height: number;
};

export async function cropScanImage(
  imageUri: string,
  preview: Size,
  frame: Rect,
): Promise<string> {
  if (!preview.width || !preview.height) {
    throw new Error("Camera preview is not ready.");
  }

  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load photo."));
    image.src = imageUri;
  });

  const photoWidth = image.naturalWidth;
  const photoHeight = image.naturalHeight;

  // Map a centered, cover-scaled preview back to the full photo.
  const scale = Math.max(
    preview.width / photoWidth,
    preview.height / photoHeight,
  );

  const offsetX = (photoWidth * scale - preview.width) / 2;
  const offsetY = (photoHeight * scale - preview.height) / 2;

  const sourceX = Math.max(0, (frame.x + offsetX) / scale);
  const sourceY = Math.max(0, (frame.y + offsetY) / scale);

  const sourceWidth = Math.min(
    frame.width / scale,
    photoWidth - sourceX,
  );

  const sourceHeight = Math.min(
    frame.height / scale,
    photoHeight - sourceY,
  );

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Scan frame is outside the photo.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth));
  canvas.height = Math.max(1, Math.round(sourceHeight));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to crop photo.");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}