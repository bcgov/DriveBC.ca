export function getCookie(key) {
  const cookies = document.cookie.split('; ')
  const cookie = cookies.filter(c => c.startsWith(key + '='))
  if (cookie[0]) { return cookie[0].split('=')[1]; }
  return '';
}

