import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import { ANTHROPIC_CONFIGURED_MESSAGE, createAnthropicClient, isAnthropicConfigured } from "../../lib/anthropic";

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
    res.status(429).json({ error: "rate_limited", message: "Too many OCR requests. Please wait a few minutes." });
  },
});

const OcrMedicine = z.object({
  medicineName: z.string(),
  medicineNameAr: z.string().nullable().optional(),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  durationDays: z.number().int().positive().nullable().optional(),
  instructions: z.string().nullable().optional(),
  instructionsAr: z.string().nullable().optional(),
});

const OcrResponse = z.object({
  medicines: z.array(OcrMedicine),
  rawNotes: z.string().nullable().optional(),
});

function mediaType(mime: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  if (mime === "image/gif") return "image/gif";
  return "image/jpeg";
}

router.post("/prescriptions/ocr-scan", ocrLimiter, upload.single("image"), async (req, res): Promise<void> => {
  if (!isAnthropicConfigured()) {
    res.status(503).json({ error: "ai_not_configured", message: ANTHROPIC_CONFIGURED_MESSAGE });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "image_required" });
    return;
  }

  const language = req.body?.language === "ar" ? "ar" : "en";
  const base64 = req.file.buffer.toString("base64");

  const system = `You are a medical prescription OCR assistant for clinics in Egypt. Read the handwritten or printed doctor prescription image and extract every medicine line into structured JSON.

Return ONLY valid JSON (no markdown fences) matching this schema:
{
  "medicines": [
    {
      "medicineName": "string (English or trade name as written)",
      "medicineNameAr": "string or null (Arabic name if visible)",
      "dosage": "string or null (e.g. 500mg, 1 tab)",
      "frequency": "string or null (e.g. 3 times daily, once at night)",
      "durationDays": number or null,
      "instructions": "string or null (e.g. after meals)",
      "instructionsAr": "string or null"
    }
  ],
  "rawNotes": "string or null (any general notes on the Rx not tied to one drug)"
}

Rules:
- Include every medicine you can read; skip illegible lines rather than guessing wildly.
- If duration is written as "5 days" or "أسبوع", convert durationDays to an integer when possible.
- Prefer the language visible on the prescription for medicineName; fill the other language field when obvious.
- Do not invent medicines not visible on the image.`;

  const userText = language === "ar"
    ? "استخرج جميع الأدوية من صورة الوصفة الطبية هذه إلى JSON حسب المخطط المطلوب."
    : "Extract all medicines from this prescription photo into JSON per the required schema.";

  try {
    const anthropic = createAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType(req.file.mimetype),
              data: base64,
            },
          },
          { type: "text", text: userText },
        ],
      }],
    });

    const block = message.content.find(b => b.type === "text");
    const text = block && block.type === "text" ? block.text.trim() : "";
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      res.status(502).json({ error: "ocr_parse_failed", message: "Could not parse OCR response as JSON.", raw: text.slice(0, 500) });
      return;
    }
    const validated = OcrResponse.safeParse(parsed);
    if (!validated.success) {
      res.status(502).json({ error: "ocr_schema_failed", message: validated.error.message, raw: text.slice(0, 500) });
      return;
    }
    res.json({
      ...validated.data,
      disclaimer: language === "ar"
        ? "راجع الأدوية المستخرجة قبل الحفظ — قد يخطئ التعرف الضوئي."
        : "Review extracted medicines before saving — OCR may contain errors.",
    });
  } catch (err: any) {
    req.log?.error({ err: err?.message }, "prescription_ocr_failed");
    res.status(502).json({ error: "ocr_call_failed", message: err?.message ?? "OCR call failed" });
  }
});

export default router;
