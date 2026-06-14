export type ParsedOcrMedicine = {
  medicineName: string;
  medicineNameAr: string | null;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  instructions: string | null;
  instructionsAr: string | null;
};

const SKIP_LINE =
  /^(dr\.?|doctor|tel|phone|mobile|fax|date|patient|name|age|weight|address|signature|stamp|rx|℞|اسم|التاريخ|العمر|الوزن|العنوان|هاتف|تليفون|موبايل|عيادة|clinic|hospital|مستشفى)/i;

const DOSAGE =
  /(\d+(?:[.,]\d+)?\s*(?:mg|g|ml|mcg|iu|µg|قرص|أقراص|كبسولة|كبسولات|tab|tabs|cap|capsule|amp|vial|سى\s*سى|cc|%))/i;

const FREQ =
  /(\d+\s*[x×]\s*\/?\s*(?:day|d)|once|twice|thrice|daily|every\s*\d+\s*h|bid|tid|qid|prn|مرة|مرات|يوميا|يوم|صباح|مساء|قبل|بعد|الوجبات|النوم)/i;

const DURATION =
  /(\d+)\s*(day|days|d|يوم|أيام|week|weeks|أسبوع|أسابيع|شهر|شهور|month)/i;

function hasArabic(s: string): boolean {
  return /[\u0600-\u06FF]/.test(s);
}

function parseDurationDays(match: RegExpMatchArray | null): number | null {
  if (!match) return null;
  const n = parseInt(match[1]!, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = match[2]!.toLowerCase();
  if (/week|أسبوع/.test(unit)) return n * 7;
  if (/month|شهر/.test(unit)) return n * 30;
  return n;
}

function cleanMedicineName(line: string, dosage: string | null, frequency: string | null, duration: string | null): string {
  let name = line;
  for (const part of [dosage, frequency, duration]) {
    if (part) name = name.replace(part, " ");
  }
  name = name.replace(/\s{2,}/g, " ").replace(/^[\d.)\-\s]+/, "").trim();
  return name || line.trim();
}

/**
 * Turn raw OCR text into medicine rows. Heuristic — user must review before save.
 */
export function parsePrescriptionOcrText(text: string): {
  medicines: ParsedOcrMedicine[];
  rawNotes: string | null;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s{2,}/g, " ").trim())
    .filter((l) => l.length >= 3);

  const medicines: ParsedOcrMedicine[] = [];
  const used = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (SKIP_LINE.test(line)) continue;
    if (/^\d{1,2}[\/\-\.]\d{1,2}/.test(line)) continue;
    if (/^[\d\s\.\-\/]+$/.test(line)) continue;

    const dosageM = line.match(DOSAGE);
    const freqM = line.match(FREQ);
    const durM = line.match(DURATION);
    const dosage = dosageM?.[0]?.trim() ?? null;
    const frequency = freqM?.[0]?.trim() ?? null;
    const durationDays = parseDurationDays(durM);
    const name = cleanMedicineName(line, dosage, frequency, durM?.[0] ?? null);

    if (name.length < 2) continue;
    // Likely a medicine line if it has dosage/freq or looks like a drug name (letters, 3+ chars)
    const looksLikeMed = dosage || frequency || durationDays || /[a-zA-Z\u0600-\u06FF]{3,}/.test(name);
    if (!looksLikeMed) continue;

    const ar = hasArabic(name);
    medicines.push({
      medicineName: ar ? name : name,
      medicineNameAr: ar ? name : null,
      dosage,
      frequency,
      durationDays,
      instructions: null,
      instructionsAr: null,
    });
    used.add(i);
  }

  // Fallback: if nothing parsed, treat each non-skipped line as a medicine name
  if (medicines.length === 0) {
    for (const line of lines) {
      if (SKIP_LINE.test(line)) continue;
      if (line.length < 4) continue;
      const ar = hasArabic(line);
      medicines.push({
        medicineName: line,
        medicineNameAr: ar ? line : null,
        dosage: null,
        frequency: null,
        durationDays: null,
        instructions: null,
        instructionsAr: null,
      });
    }
  }

  const rawNotes = text.trim().length > 0 ? text.trim().slice(0, 4000) : null;
  return { medicines: medicines.slice(0, 50), rawNotes };
}
