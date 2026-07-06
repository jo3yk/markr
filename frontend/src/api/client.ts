import { AggregateSummary, HistogramData, TestSummary } from '../types';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const apiBaseUrl = rawApiBaseUrl.trim().replace(/\/$/, '');

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = (body).error || response.statusText || 'API request failed';
    throw new Error(errorMessage);
  }
  return body as T;
}

export async function uploadResults(xml: string) {
  return apiFetch<{ imported: number }>('/import', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml+markr' },
    body: xml,
  });
}

export async function fetchTests() {
  const body = await apiFetch<{ tests: TestSummary[] }>('/tests');
  return body.tests ?? [];
}

export async function fetchAggregate(testId: string) {
  return apiFetch<AggregateSummary>(`/results/${encodeURIComponent(testId)}/aggregate`);
}

export async function fetchHistogram(testId: string) {
  return apiFetch<HistogramData>(`/results/${encodeURIComponent(testId)}/histogram`);
}
