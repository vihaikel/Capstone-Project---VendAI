const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

async function request(path, options = {}) {
  const { body, headers, ...fetchOptions } = options;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw new Error(
      `Tidak dapat terhubung ke API (${API_BASE_URL}). Pastikan FastAPI sedang berjalan.`,
      { cause: error },
    );
  }

  const data = await response.json();

  if (!response.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : detail
          ? JSON.stringify(detail)
          : `Permintaan API gagal dengan status ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

export function checkApiHealth() {
  return request('/health');
}

export function analyzeRisk(payload) {
  return request('/risk_analysis', { method: 'POST', body: payload });
}

export function getRecommendations(payload) {
  return request('/recommendations', { method: 'POST', body: payload });
}

export function createProcurement(payload) {
  return request('/procurement', { method: 'POST', body: payload });
}

export function generateExplanation(payload) {
  return request('/generate_explanation', { method: 'POST', body: payload });
}
