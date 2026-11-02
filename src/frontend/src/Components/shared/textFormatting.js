// Automatic title case conversion for Rest Stop Names and Distance from Municipality
export const toTitleCase = (str) => {
  if (!str) return '';

  // 1. Normalize to lowercase, then split by separators (spaces, hyphens, slashes, parens, @).
  return str.toLowerCase().split(/(\s+|-|\/|\(|\)|@)/).map((word, index) => {

    // 2. Return separators as is
    if (/^(\s+|-|\/|\(|\)|@)$/.test(word)) return word;

    // 3. Handle words that should always be UPPERCASE
    if (['bc', 'sb', 'nb', 'eb', 'wb'].includes(word)) return word.toUpperCase();

    // 4. Handle words that should always be lowercase
    if (word === 'km' || word === 'kms') return word;
    if (word === 'of' && index > 0) return word;

    // 5. Handle "Mc" surnames (e.g., McBride, McRae)
    if (word.startsWith('mc') && word.length > 2) {
      return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3);
    }

    // 6. Default: Capitalize the first letter
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join('');
};
