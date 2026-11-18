/**
 * Consent-Guarded Desktop Clipboard Helper
 * Prevents silent or unauthorized clipboard inspection.
 */
export async function readClipboardWithConsent(confirmPrompt?: string): Promise<string | null> {
  if (typeof window === 'undefined' || !navigator.clipboard) return null;

  const promptMessage =
    confirmPrompt ||
    'JARVIS is requesting permission to read your clipboard text. Do you grant permission?';

  const userConfirmed = window.confirm(promptMessage);
  if (!userConfirmed) {
    return null;
  }

  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

export async function writeClipboardWithConsent(
  text: string,
  askConsent: boolean = false,
): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) return false;

  if (askConsent) {
    const userConfirmed = window.confirm(
      `JARVIS is requesting permission to copy text to your clipboard:\n\n"${text.slice(0, 80)}..."`,
    );
    if (!userConfirmed) return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
