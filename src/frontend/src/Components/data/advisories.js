
export async function getAdvisories() {
  return fetch('http://localhost:8000/api/travel-advisory-messages/', {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json());
}
