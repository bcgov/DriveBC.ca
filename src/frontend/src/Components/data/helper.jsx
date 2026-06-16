class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name; // Set the name of the error to the class name
    this.message = message; // Set the error message
    this.stack = (new Error()).stack; // Generate stack trace
  }
}

export class NetworkError extends CustomError {
  constructor() {
    super("Network error");
  }
}

export class NotFoundError extends CustomError {
  constructor() {
    super("Not found error");
  }
}

export class ServerError extends CustomError {
  constructor() {
    super("Server error");
  }
}

const request = (url, params = {}, headers = {}, include_credentials = true, method = "GET") => {
  const options = {
    headers,
    method,
  };

  if (include_credentials) {
    options.credentials = 'include';
  }

  if ("GET" === method) {
    url += "?" + new URLSearchParams(params).toString();
  } else {
    options.body = JSON.stringify(params);
  }

  const result = fetch(`${url}`, options).then((response) => {
    const statusCode = response.status.toString();

    // Raise error for 4xx-5xx status codes
    if (statusCode === '404') {
      throw new NotFoundError();
    } else if (statusCode.startsWith('4')) {
      throw new NetworkError();
    } else if (statusCode.startsWith('5')) {
      throw new ServerError();
    }

    // Read the response body as text
    return response.text().then((text) => {
      // Check if the response body is empty
      if (!text) {
        return {}; // Return an empty object or suitable default value
      }

      return JSON.parse(text);
    });

  }).catch((error) => {
    // throw network error on failed fetches
    if (error instanceof TypeError && (
      error.message.includes("Failed to fetch") ||  // Chrome
      error.message.includes("Load failed") ||  // Safari
      error.message.includes("NetworkError") // Firefox
    )) {
      throw new NetworkError();

    // Propagate the error
    } else {
      throw error;
    }
  });

  return result;
};

export const get = (url, params, headers, include_credentials=true) => request(url, params, headers, include_credentials, "GET");
export const post = (url, params, headers, include_credentials=true) => request(url, params, headers, include_credentials, "POST");

export const stripRichText = (richText) => {
  // Strip all link tags and replace all other tags with a space
  const strippedText = richText.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1").replace(/(<([^>]+)>)/gi, " ");

  // Return the first 250 characters
  return strippedText.substring(0, 250);
}
