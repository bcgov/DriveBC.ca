export const toTitleCase = str => {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(/(\s+|-|\/|\(|\)|@)/)
    .map((word, index) => {
      if (/^(\s+|-|\/|\(|\)|@)$/.test(word)) return word;
      if (['bc', 'sb', 'nb', 'eb', 'wb'].includes(word))
        return word.toUpperCase();
      if (word === 'km' || word === 'kms') return word;
      if (word === 'of' && index > 0) return word;
      if (word.startsWith('mc') && word.length > 2) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
};
