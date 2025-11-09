import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { useConfigStore } from '../store/configStore';

export class ApiClientError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

const buildHeaders = () => {
  const { apiKey, accessToken, tokenType, customHeaderName } = useConfigStore.getState();
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers[customHeaderName] = apiKey;
  }
  if (accessToken) {
    headers.Authorization = tokenType === 'Custom' ? accessToken : `${tokenType} ${accessToken}`;
  }

  return headers;
};

interface ApiRequestConfig extends AxiosRequestConfig {
  usePrefix?: boolean;
}

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  const { usePrefix, ...axiosConfig } = config;
  const { baseUrl, apiPrefix } = useConfigStore.getState();
  const url = resolveUrl(baseUrl, apiPrefix, axiosConfig.url, usePrefix !== false);
  try {
    const response = await axios.request<T>({
      headers: buildHeaders(),
      timeout: axiosConfig.timeout ?? 15_000,
      ...axiosConfig,
      url,
      baseURL: undefined
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

function resolveUrl(baseUrl: string, apiPrefix: string, url: AxiosRequestConfig['url'], usePrefix: boolean): string {
  const target = typeof url === 'string' ? url : '';
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPrefix = usePrefix ? apiPrefix : '';

  if (!target) {
    return mergeSegments(normalizedBase, normalizedPrefix, '/');
  }

  if (/^[a-zA-Z][a-zA-Z\d+-.]*:/.test(target)) {
    return target;
  }

  const path = target.startsWith('/') ? target : `/${target}`;
  return mergeSegments(normalizedBase, normalizedPrefix, path);
}

function mergeSegments(baseUrl: string, prefix: string, path: string): string {
  const normalizedBase = trimTrailingSlash(baseUrl);
  const normalizedPrefix = trimSlashes(prefix);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const prefixSegment = normalizedPrefix ? `/${normalizedPrefix}` : '';

  if (!normalizedBase) {
    const combinedPath = `${prefixSegment}${normalizedPath}`;
    return combinedPath || '/';
  }

  return `${normalizedBase}${prefixSegment}${normalizedPath}`;
}

const trimTrailingSlash = (value?: string) => (value ? value.replace(/\/+$/, '') : '');
const trimSlashes = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
};

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const parsed = parseBaseUrl(trimmed);
  if (!parsed) {
    return trimmed;
  }

  return `${parsed.protocol}//${parsed.host}`;
}

function parseBaseUrl(value: string): URL | undefined {
  const candidates = [value, withDefaultScheme(value)];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate);
    } catch {
      continue;
    }
  }

  return undefined;
}

function withDefaultScheme(value: string) {
  const absolutePattern = /^[a-zA-Z][a-zA-Z\d+-.]*:\/\//;
  if (!value || absolutePattern.test(value)) {
    return value;
  }

  if (value.startsWith('//')) {
    return `http:${value}`;
  }

  const hostLikePattern = /^[\w.-]+(?::\d+)?(?:\/.*)?$/;
  if (hostLikePattern.test(value)) {
    return `http://${value}`;
  }

  return value;
}

function normalizeError(error: unknown): ApiClientError {
  if (axios.isAxiosError(error)) {
    return axiosErrorToApiError(error);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message);
  }

  return new ApiClientError('Unknown error occurred', undefined, error);
}

const axiosErrorToApiError = (error: AxiosError): ApiClientError => {
  const status = error.response?.status;

  if (!error.response) {
    const targetUrl = `${error.config?.url ?? ''}`;
    const hint =
      'Network error. Ensure the API is reachable and, if running locally, that CORS preflight requests succeed or use the provided dev proxy.';
    const message = targetUrl ? `${hint} (Request: ${targetUrl})` : hint;
    return new ApiClientError(message, status, error.cause);
  }

  const message =
    typeof error.response.data === 'object' && error.response.data !== null
      ? JSON.stringify(error.response.data)
      : error.message;

  return new ApiClientError(message, status, error.response.data ?? error.cause);
};
