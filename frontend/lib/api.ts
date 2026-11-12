const API_BASE_URL = '/api';

async function getCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/users/csrf/`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to prepare a secure request.');
  }

  const data = await response.json();
  return data.csrfToken as string;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const method = (options.method ?? 'GET').toUpperCase();

  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    headers.set('X-CSRFToken', await getCsrfToken());
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 403 && headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', await getCsrfToken());
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });
  }

  return response;
}