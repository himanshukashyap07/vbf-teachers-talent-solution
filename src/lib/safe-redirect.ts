/**
 * Open-redirect guard. Only same-site absolute paths are allowed ("/dashboard", "/receipt/abc?x=1").
 * Anything else ("https://evil.com", "//evil.com", "/\\evil.com", "javascript:…") falls back.
 */
export function safeRedirectPath(input: string | null | undefined, fallback = "/dashboard"): string {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(input)) return fallback; // control chars / header injection
  return input;
}
