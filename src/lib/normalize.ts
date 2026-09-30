/**
 * Normalizes data coming from databases or APIs to prevent client-side exceptions
 * when React components attempt to access properties of null/undefined values.
 * 
 * Rules applied:
 * - null -> "" (for basic string fields)
 * - null -> [] (for fields that look like arrays based on naming conventions)
 * - null -> {} (for fields that look like objects)
 */
export function normalizeData(data: any): any {
  if (data === undefined) return data;
  if (data === null) return ""; // Base primitive fallback

  if (Array.isArray(data)) {
    return data.map(item => normalizeData(item));
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const normalized: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (data[key] === null) {
          // Heuristics for Array fields
          if (
            (key.endsWith('s') && 
             !key.endsWith('status') && 
             !key.endsWith('notes') && 
             !key.endsWith('details') && 
             !key.endsWith('blockers') &&
             !key.endsWith('hours') &&
             !key.endsWith('address')) ||
             key.endsWith('List') ||
             key.endsWith('Array')
          ) {
            normalized[key] = [];
          } 
          // Heuristics for Object fields
          else if (
            key.includes('metadata') || 
            key.includes('details') ||
            key.includes('config') ||
            key.includes('settings') ||
            key === 'profile' ||
            key === 'user' ||
            key === 'project' ||
            key === 'data' ||
            key === 'payload'
          ) {
            normalized[key] = {};
          } 
          // Default to empty string for primitives (strings/numbers)
          else {
            normalized[key] = "";
          }
        } else {
          normalized[key] = normalizeData(data[key]);
        }
      }
    }
    return normalized;
  }

  return data;
}
