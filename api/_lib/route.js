// Normalize Vercel catch-all query values across runtimes.
// A one-segment catch-all parameter may be a string, while a multi-segment
// path is commonly represented as an array. Routers should handle both.
export function routeSegments(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}
