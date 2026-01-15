import { getCookie } from "../../util";

// Env Variables
import { API_HOST } from "../../env.js";

export const sendVerificationEmail = async ({ my_routes = false } = {}) => {
  const url = `${API_HOST}/api/users/send-verification-email/`;

  try {
   const response = await fetch(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-CSRFToken': getCookie('csrftoken')
     },
     body: JSON.stringify({ my_routes }),
     credentials: 'include'
   });

   if (!response.ok) {
     throw new Error(`Error: ${response.statusText}`);
   }

  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}
