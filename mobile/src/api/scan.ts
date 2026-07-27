import { apiPostFormData } from "./client";

export interface OCRResponse {
  text: string;
}

export async function scanImageForText(
  image: Blob,
  fileName = "scan.jpg",
): Promise<OCRResponse> {
  const formData = new FormData();

  formData.append("image", image, fileName);

  return apiPostFormData<OCRResponse>("/ocr", formData);
}