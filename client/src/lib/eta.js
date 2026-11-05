export function estimateWait(position, avgServiceMin) {
  return position * (avgServiceMin || 20)
}
