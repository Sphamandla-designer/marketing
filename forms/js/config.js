/**
 * Deployment configuration.
 *
 * SUBMIT_ENDPOINT: when set, a completed form is POSTed here as multipart/form-data
 * with fields: formType, docNumber, identifier, data (JSON), pdf (file) and
 * image-1..N (PNG files). Leave empty to keep submissions local only
 * (stored in the browser's IndexedDB and downloadable).
 */
export const CONFIG = {
  SUBMIT_ENDPOINT: '',
  PNG_DPI: 300,
  PREVIEW_DPI: 96,
};
