import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";

export type OCRResult = {
  text: string;
};

export async function recognizeTextFromImage(
  imageUri: string,
): Promise<OCRResult> {
  const normalizedUri = imageUri.trim();

  if (!normalizedUri) {
    throw new Error("No image was provided for text recognition.");
  }

  const result = await recognizeText(normalizedUri);
  const text = result.text?.trim() ?? "";

  if (!text) {
    throw new Error(
      "No text was detected. Try better lighting and hold the camera parallel to the page.",
    );
  }

  return { text };
}