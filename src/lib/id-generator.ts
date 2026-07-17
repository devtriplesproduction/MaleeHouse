export function generateSequentialCode(
  prefix: string,
  existingCodes: string[],
  parentCode?: string,
  explicitPrefix?: string
): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const monthPrefix = `${yy}${mm}`;

  // If there's a parent code (e.g., QUO-PRJ-2606-001-01), use it as the base.
  let searchPrefix = '';
  if (explicitPrefix) {
    searchPrefix = explicitPrefix;
  } else if (parentCode) {
    searchPrefix = `${prefix}-${parentCode}-`;
  } else {
    searchPrefix = `${prefix}-${monthPrefix}-`;
  }

  // Find all existing codes that start with the searchPrefix
  const matchingCodes = existingCodes
    .filter((code: any) => code?.startsWith(searchPrefix))
    .map((code: any) => {
      const parts = code.split('-');
      const lastPart = parts[parts.length - 1];
      // Handle versioned suffixes like -V2
      const numPart = lastPart.replace(/-V\d+$/, '');
      return parseInt(numPart, 10);
    })
    .filter((num: any) => !isNaN(num));

  // If it's a project starting with explicitPrefix, start at 99 so the first one is 100
  const defaultMax = explicitPrefix ? 99 : 0;
  const maxSeq = matchingCodes.length > 0 ? Math.max(...matchingCodes) : defaultMax;
  
  // Use 3 digits, or 2 digits if it's a sub-sequence based on parentCode
  const padLength = parentCode ? 2 : 3;
  const nextSeq = (maxSeq + 1).toString().padStart(padLength, '0');

  return `${searchPrefix}${nextSeq}`;
}
