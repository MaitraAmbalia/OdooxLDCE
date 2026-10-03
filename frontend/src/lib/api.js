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
