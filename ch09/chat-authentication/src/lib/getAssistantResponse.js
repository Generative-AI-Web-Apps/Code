export async function getAssistantResponse(text, path = '/api') {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch response from server';
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // ignore JSON parsing errors
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}
