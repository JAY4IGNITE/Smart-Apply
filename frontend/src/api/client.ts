/**
 * API client — a thin fetch wrapper that attaches the auth token and the
 * realtime session id to every request, and reports 401s back up so the
 * app can log the user out.
 *
 * `configureClient` is called synchronously during AuthProvider's render
 * (not inside a useEffect). React runs child effects before parent
 * effects, so wiring this up in an effect would mean the first render's
 * child components could fire their own data-fetching effects before the
 * token getter existed — sending unauthenticated requests on first paint.
 * `apiFetch` also falls back to reading the token directly from
 * localStorage so a request is never sent without it, even in that
 * brief window before configureClient runs.
 */

let _getToken: (() => string | null) | null = null;
let _getSessionId: (() => string | null) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function configureClient(opts: {
  getToken: () => string | null;
  getSessionId: () => string | null;
  onUnauthorized: () => void;
}) {
  _getToken = opts.getToken;
  _getSessionId = opts.getSessionId;
  _onUnauthorized = opts.onUnauthorized;
}

export interface ApiResponse<T = unknown> {
  data: T;
  ok: boolean;
  status: number;
}

export function getApiBaseUrl(endpoint?: string): string {
  const fallback = import.meta.env.VITE_API_BASE_URL || '/api';

  let baseUrl = fallback;

  if (endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (
      cleanEndpoint.startsWith('/ai') ||
      cleanEndpoint.startsWith('/interview') ||
      cleanEndpoint.startsWith('/tailor') ||
      cleanEndpoint.startsWith('/jobs') ||
      cleanEndpoint.startsWith('/projects') ||
      cleanEndpoint.startsWith('/cover-letter')
    ) {
      baseUrl = import.meta.env.VITE_AI_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || fallback;
    } else if (
      cleanEndpoint.startsWith('/resume-maker') ||
      cleanEndpoint.startsWith('/code-execution') ||
      cleanEndpoint.startsWith('/upload')
    ) {
      baseUrl = import.meta.env.VITE_TOOLS_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || fallback;
    } else {
      baseUrl = import.meta.env.VITE_CORE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || fallback;
    }
  }

  baseUrl = baseUrl.replace(/\/+$/, '');

  if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl}/api`;
  }

  return baseUrl;
}

/** Converts the REST base URL into a ws:// or wss:// origin + path prefix. */
export function getWsUrl(path: string): string {
  const baseUrl = getApiBaseUrl(path);
  if (baseUrl.startsWith('http')) {
    return baseUrl.replace(/^http/, 'ws') + path;
  }
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${window.location.host}${baseUrl}${path}`;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = (_getToken ? _getToken() : null) || localStorage.getItem('sa_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const sessionId = _getSessionId?.();
  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = getApiBaseUrl(endpoint);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    // Network error (e.g. server down, offline). Wait 500ms and retry exactly once.
    await new Promise(resolve => setTimeout(resolve, 500));
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  if (response.status === 401) {
    _onUnauthorized?.();
  }

  let data: T;
  try {
    data = await response.json();
  } catch {
    data = {} as T;
  }

  return { data, ok: response.ok, status: response.status };
}

/** Extracts a human-readable message from a failed ApiResponse, with a fallback. */
export function apiErrorMessage(res: ApiResponse<unknown>, fallback: string): string {
  const data = res.data as { detail?: string } | undefined;
  return data?.detail || fallback;
}

/**
 * Like `apiFetch` but returns the raw `Response` without parsing the body —
 * for endpoints that stream (e.g. the chatbot's token stream), where the
 * caller wants to read `response.body` incrementally. Attaches the same auth
 * and session headers. Does NOT auto-retry, since a stream can't be replayed.
 */
export async function apiFetchRaw(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = (_getToken ? _getToken() : null) || localStorage.getItem('sa_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const sessionId = _getSessionId?.();
  if (sessionId) headers['X-Session-ID'] = sessionId;

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = getApiBaseUrl(endpoint);
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) _onUnauthorized?.();
  return response;
}
