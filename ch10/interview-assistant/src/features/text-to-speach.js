export function isTTSEnabled(checkLocalStorage = true) {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && checkLocalStorage) {
    try {
      const localPreference = localStorage.getItem('feature_tts_enabled');
      if (localPreference !== null) {
        return localPreference === 'true';
      }
    } catch (e) {}
  }
  // Fall back to environment variable
  // In browser, this will use the NEXT_PUBLIC_ prefixed env variable
  // In Node.js, this will use the server environment variable
  return process.env.NEXT_PUBLIC_FEATURE_TTS_ENABLED === 'true';
}
