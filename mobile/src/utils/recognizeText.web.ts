import { scanImageForText } from "../api/scan";

export type OCRResult = {
  text: string;
};

export async function recognizeTextFromImage(
  imageUri: string,
): Promise<OCRResult> {
  const imageResponse = await fetch(imageUri);

  if (!imageResponse.ok) {
    throw new Error("Unable to read the captured image.");
  }

  const imageBlob = await imageResponse.blob();

  return scanImageForText(imageBlob, "scan.jpg");
}
