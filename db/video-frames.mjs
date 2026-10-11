export function sampleFrameTimes(durationSeconds, count = 6) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isInteger(count) || count < 1) return [];
  return Array.from({ length: count }, (_, index) => durationSeconds * ((index + 1) / (count + 1)));
}

export function toggleBoundedSelection(selected, id, reserved = 0, maximum = 4) {
  if (selected.includes(id)) return selected.filter((value) => value !== id);
  return selected.length + reserved < maximum ? [...selected, id] : selected;
}

export function dataUrlToImageFile(dataUrl, name) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new TypeError("Invalid image preview.");
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], name, { type: match[1] });
}
