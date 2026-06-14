import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { recognizePrescriptionImage } from "../../lib/localOcr";
import { parsePrescriptionOcrText } from "../../lib/prescriptionOcrParse";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    if (!ok) {
      cb(new Error("Only JPEG, PNG, WEBP, or GIF images are supported."));
      return;
    }
    cb(null, true);
  },
});

const ocrLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (_req, res) => {
    res.status(429).json({ error: "rate_limited", message: "Too many scan requests. Please wait a few minutes." });
  },
});

router.post("/prescriptions/ocr-scan", ocrLimiter, upload.single("image"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "image_required" });
    return;
  }

  const language = req.body?.language === "ar" ? "ar" : "en";

  try {
    const rawText = await recognizePrescriptionImage(req.file.buffer);
    const { medicines, rawNotes } = parsePrescriptionOcrText(rawText);

    if (medicines.length === 0) {
      res.status(400).json({
        error: "no_medicines_detected",
        message: language === "ar"
          ? "لم يُعثر على أسطر أدوية. جرّب صورة أوضح أو أضف الوصفة يدوياً."
          : "No medicine lines detected. Try a clearer photo or add prescriptions manually.",
        rawText: rawText.slice(0, 1500),
      });
      return;
    }

    res.json({
      medicines,
      rawNotes,
      engine: "tesseract",
      disclaimer: language === "ar"
        ? "مسح محلي بدون ذكاء اصطناعي — راجع كل دواء قبل الحفظ (قد تخطئ القراءة خاصةً بالخط اليدوي)."
        : "Local scan (no AI) — review every medicine before saving. Handwriting may be misread.",
    });
  } catch (err: unknown) {
    req.log?.error({ err: err instanceof Error ? err.message : err }, "prescription_ocr_failed");
    res.status(502).json({
      error: "ocr_failed",
      message: err instanceof Error ? err.message : "OCR failed",
    });
  }
});

export default router;
