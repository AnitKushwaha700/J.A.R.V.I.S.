/**
 * Desktop Global Keyboard Shortcuts
 * Shortcut: Ctrl+Shift+J (Windows/Linux) or Cmd+Shift+J (macOS)
 */
export function registerGlobalShortcut(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleKeyDown = (e: KeyboardEvent) => {
    const isModifier = e.ctrlKey || e.metaKey;
    if (isModifier && e.shiftKey && e.code === 'KeyJ') {
      e.preventDefault();
      callback();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
