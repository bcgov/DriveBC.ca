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

export class ServerError extends CustomError {
  constructor() {
    super("Server error");
  }
}

const request = (url, params = {}, headers = {}, method = "GET") => {
  const options = {
    headers,
    method
  };

  if ("GET" === method) {
    url += "?" + new URLSearchParams(params).toString();
  } else {
    options.body = JSON.stringify(params);
  }

  const result = fetch(`${url}`, options).then((response) => {
    if (!response.ok) {
      throw response.status == 500 ? new ServerError() : new NetworkError;
    }

    return response.json();

  }).catch((error) => {
    // throw network error on failed fetches
    if (error instanceof TypeError && error.message == "Failed to fetch") {
      throw new NetworkError();

    // Propagate the error
    } else {
      throw error;
    }
  });

  return result;
};

export const get = (url, params, headers) => request(url, params, headers, "GET");
export const post = (url, params, headers) => request(url, params, headers, "POST");

export const stripRichText = (richText) => {
  const strippedText = richText.replace(/(<([^>]+)>)/gi, "");
  return strippedText.substring(0, 250);
}
