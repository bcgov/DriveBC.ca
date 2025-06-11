// DBC22-4177
// https://github.com/t49tran/react-google-recaptcha-v3/issues/182#issuecomment-2646793934
import { useCallback, useEffect } from 'react';

export const useRecaptchaVerification = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${window.RECAPTCHA_CLIENT_ID}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const executeRecaptcha = useCallback(async (action) => {
    if (typeof window !== 'undefined' && window.grecaptcha) {
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(window.RECAPTCHA_CLIENT_ID, { action }).then(resolve).catch(reject);
        });
      });
    }
    throw new Error('reCAPTCHA is not available');
  }, []);

  const getRecaptchaAPIToken = useCallback(
    async (action = 'api') => {
      const token = await executeRecaptcha(action);
      if (!token) {
        console.error('Failed to generate reCAPTCHA token');
        return null;
      }

      return token;
    },
    [executeRecaptcha],
  );

  const checkRecaptcha = useCallback(async () => {
    const token = await getRecaptchaAPIToken('login');
    if (!token) {
      return false;
    }
    // Verify the token with your server
    return true;
  }, [getRecaptchaAPIToken]);

  return { checkRecaptcha, getRecaptchaAPIToken };
};
