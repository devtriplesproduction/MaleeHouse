export function generateSequentialCode(
  prefix: string,
  existingCodes: string[],
  parentCode?: string
): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const monthPrefix = `${yy}${mm}`;

  // If there's a parent code (e.g., QUO-PRJ-2606-001-01), use it as the base.
  let searchPrefix = '';
  if (parentCode) {
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

  const maxSeq = matchingCodes.length > 0 ? Math.max(...matchingCodes) : 0;
  const nextSeq = (maxSeq + 1).toString().padStart(parentCode ? 2 : 3, '0');

  return `${searchPrefix}${nextSeq}`;
}
