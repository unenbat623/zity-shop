/**
 * Zity Chef backend рүү хандах нэгдсэн HTTP client.
 *
 * Юуг шийддэг вэ:
 *  - dev дээр Vite proxy, production дээр public URL (CORS асуудлаас сэргийлнэ)
 *  - хүсэлт бүрт timeout — сервер хариу өгөхгүй бол UI мөнхөд эргэлдэхгүй
 *  - нэвтэрсэн хэрэглэгчийн Supabase token-г автоматаар Authorization header-т залгана
 *  - алдааг нэг төрлийн `ApiError` болгож, дэлгэц дээр ойлгомжтой мессеж гаргах боломж өгнө
 */

import { getChefApiBase } from '../lib/env';

const DEFAULT_TIMEOUT_MS = 8000;

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly path: string;

  constructor(kind: ApiErrorKind, path: string, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.path = path;
    this.status = status;
  }

  /** Хэрэглэгчид харуулах монгол мессеж */
  get userMessage(): string {
    switch (this.kind) {
      case 'timeout':
        return 'Zity Chef сервер хариу өгөх хугацаа хэтэрлээ.';
      case 'network':
        return 'Zity Chef сервертэй холбогдож чадсангүй.';
      case 'parse':
        return 'Zity Chef серверээс ирсэн өгөгдлийг уншиж чадсангүй.';
      case 'http':
        if (this.status === 401 || this.status === 403) {
          return 'Zity Chef сервер рүү хандах эрх хүрэлцэхгүй байна.';
        }
        if (this.status === 404) return 'Хүссэн Zity Chef endpoint олдсонгүй.';
        return `Zity Chef сервер алдаа буцаалаа (${this.status}).`;
      default:
        return 'Тодорхойгүй алдаа гарлаа.';
    }
  }
}

/**
 * Нэвтэрсэн хэрэглэгчийн token-г нийлүүлэгч. Auth store-оос бүртгэгдэнэ.
 *
 * Async байж болно: supabase-js нь session-оо хадгалснаас сэргээхдээ бага зэрэг
 * хугацаа зарцуулдаг. Синхроноор уншвал апп ачаалсны дараах эхний хүсэлт
 * token-гүй явж 401 авах эрсдэлтэй.
 */
type TokenProvider = () => string | null | Promise<string | null>;

let tokenProvider: TokenProvider = () => null;

export function setAuthTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  /** Гадны AbortSignal (жишээ нь component unmount) */
  signal?: AbortSignal;
  /** Token байхгүй ч хүсэлт явуулах эсэх. Default: тийм. */
  requireAuth?: boolean;
}

function buildUrl(path: string): string {
  const base = getChefApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Chef API руу JSON хүсэлт илгээнэ.
 * @param path `/api` дараах зам, жишээ нь `/store/products`
 */
export async function chefRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, signal, requireAuth = false } = options;

  const token = await tokenProvider();
  if (requireAuth && !token) {
    throw new ApiError('http', path, 'Нэвтрэх шаардлагатай.', 401);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Гадны signal-ыг дотоод controller-той холбоно
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError('http', path, `HTTP ${response.status} ${response.statusText}`, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('parse', path, 'JSON биш хариу ирлээ.');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      // Гадны signal-аар цуцалсан бол timeout биш
      if (signal?.aborted) throw new ApiError('network', path, 'Хүсэлт цуцлагдлаа.');
      throw new ApiError('timeout', path, `Хугацаа хэтэрлээ (${timeoutMs}ms).`);
    }

    throw new ApiError('network', path, error instanceof Error ? error.message : 'Сүлжээний алдаа.');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** Алдаанаас хэрэглэгчид харуулах мессеж гаргах туслах */
export function toUserMessage(error: unknown, fallback = 'Алдаа гарлаа. Дахин оролдоно уу.'): string {
  if (error instanceof ApiError) return error.userMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
