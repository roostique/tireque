// Absolute link to an in-app path, for QR codes and copy buttons.
export function appUrl(path) {
  return `${window.location.origin}${path}`
}
