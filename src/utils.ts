export const formatPhone = (v: string): string => {
  if (!v) return '';
  let r = v.replace(/\D/g, '');
  if (r.length > 11) r = r.slice(0, 11);
  
  if (r.length > 10) {
    // (14) 99123-4567
    return `(${r.slice(0, 2)}) ${r.slice(2, 7)}-${r.slice(7)}`;
  } else if (r.length > 6) {
    // (14) 9123-4567
    return `(${r.slice(0, 2)}) ${r.slice(2, 6)}-${r.slice(6)}`;
  } else if (r.length > 2) {
    // (14) 9123
    return `(${r.slice(0, 2)}) ${r.slice(2)}`;
  } else if (r.length > 0) {
    // (14
    return `(${r}`;
  }
  return r;
};

export const toTitleCase = (str: string): string => {
  const prepositions = ['da', 'de', 'do', 'das', 'dos', 'e'];
  
  // Remove special characters, keeping letters, numbers, spaces, apostrophes, and hyphens
  const cleanedStr = str.replace(/[^a-zA-ZÀ-ÿ0-9\s'-]/g, '').replace(/\s+/g, ' ');

  return cleanedStr
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index !== 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trimStart(); // Prevent leading spaces
};
