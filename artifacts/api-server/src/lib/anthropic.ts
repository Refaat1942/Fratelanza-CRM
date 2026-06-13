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
  "AI patient summary is optional and needs ANTHROPIC_API_KEY in .env. Prescription photo scan works without any API key.";
