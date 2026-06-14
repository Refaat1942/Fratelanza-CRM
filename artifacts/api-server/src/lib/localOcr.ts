import { createWorker, type Worker } from "tesseract.js";

let workerReady: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerReady) {
    workerReady = createWorker("eng+ara");
  }
  return workerReady;
}

/** Free local OCR — no API key. First run downloads language data (~once). */
export async function recognizePrescriptionImage(buffer: Buffer): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(buffer);
  return data.text ?? "";
}
