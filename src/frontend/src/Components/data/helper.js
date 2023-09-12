const request = (url, params = {}, headers = {}, method = "GET") => {
  const options = {
    ...headers,
    method
  };

  if ("GET" === method) {
    url += "?" + new URLSearchParams(params).toString();
  } else {
    options.body = JSON.stringify(params);
  }

  const result = fetch(`https://${url}`, options).then((response) => response.json());
  return result;
};

export const get = (url, params, headers) => request(url, params, headers, "GET");
export const post = (url, params, headers) => request(url, params, headers, "POST");
