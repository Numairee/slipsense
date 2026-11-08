// High-Performance On-Device Slip OCR Engine (Tesseract.js)
// Extracts real amounts, dates, times, payees, and reference numbers from Thai bank transfer slips

import { createWorker } from 'tesseract.js';
import { parseTextToSlipFields } from './slipFields.js';
export { normalizeThaiOcr, parseTextToSlipFields } from './slipFields.js';

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      try {
        const worker = await createWorker('eng+tha', 1, {
          logger: () => {},
        });
        return worker;
      } catch (err) {
        workerPromise = null;
        throw err;
      }
    })();
  }
  return workerPromise;
}

/**
 * Preprocess image on canvas: Gentle Grayscale + Contrast Enhancement
 * Preserves gray and colored slip text without wiping out midtones
 */
export function preprocessCanvasForOCR(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Gentle contrast curve that keeps gray slip labels (rgb 120-180) legible
    const enhanced = gray > 225 ? 255 : gray < 50 ? 0 : Math.round(((gray - 50) / 175) * 220);
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Run OCR on image canvas with timeout protection so UI never hangs
 */
// Serialize access to the shared worker, including calls from concurrent imports.
let ocrQueue = Promise.resolve();
export function runSlipOCR(canvas, timeoutMs = 30000) {
  const task = ocrQueue.then(() => recognizeSlip(canvas, timeoutMs));
  ocrQueue = task.catch(() => {});
  return task;
}

async function recognizeSlip(canvas, timeoutMs) {
  let timer;
  const pendingWorker = getWorker();
  try {
    const ocrTask = (async () => {
      const worker = await pendingWorker;
      const ret = await worker.recognize(preprocessCanvasForOCR(canvas));
      const text = ret?.data?.text || '';
      return { success: true, text, parsed: parseTextToSlipFields(text) };
    })();
    const timeoutTask = new Promise(resolve => {
      timer = setTimeout(() => {
        // Reset a timed-out worker so it cannot block the rest of a batch.
        workerPromise = null;
        pendingWorker.then(worker => worker.terminate()).catch(() => {});
        resolve({ success: false, text: '', parsed: null, timedOut: true });
      }, timeoutMs);
    });
    return await Promise.race([ocrTask, timeoutTask]);
  } catch {
    return { success: false, text: '', parsed: null };
  } finally {
    clearTimeout(timer);
  }
}
