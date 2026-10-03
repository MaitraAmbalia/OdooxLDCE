export async function getJson(path, { signal } = {}) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    const error = new Error(
      "Unable to load this information. Please try again.",
    );
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// POST/PATCH/DELETE with a JSON body; throws the server's message (or its first validation detail).
export async function sendJson(path, { method = "POST", body, headers } = {}) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.error?.details?.[0]?.message || json.error?.message || "Something went wrong. Please try again.");
    error.status = response.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}
