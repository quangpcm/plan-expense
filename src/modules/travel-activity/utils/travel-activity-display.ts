export function toMapHref(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}
