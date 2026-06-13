import Anthropic from "@anthropic-ai/sdk";

/** API key: Replit AI Integrations name or standard Anthropic env var. */
export function getAnthropicApiKey(): string | undefined {
  const key = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  return key?.trim() || undefined;
}

/** Optional proxy/base URL (Replit). Omit for api.anthropic.com. */
export function getAnthropicBaseUrl(): string | undefined {
  const url = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_API_BASE_URL;
  return url?.trim() || undefined;
}

export function isAnthropicConfigured(): boolean {
  return !!getAnthropicApiKey();
}

export function createAnthropicClient(): Anthropic {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new Error("ai_not_configured");
  }
  const baseURL = getAnthropicBaseUrl();
  return new Anthropic({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

export const ANTHROPIC_CONFIGURED_MESSAGE =
  "Prescription OCR needs an Anthropic API key. Add ANTHROPIC_API_KEY to .env on the VPS, then run: docker compose -p fratelanza up -d --build app";
