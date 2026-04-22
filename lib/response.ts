import { NextResponse } from 'next/server'
import { ErrorCode } from './config'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
  }
  meta?: {
    request_id?: string
    processing_ms?: number
    remaining_credits?: number
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  )
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
      meta,
    },
    { status }
  )
}

export function generateRequestId(): string {
  return `req_${Math.random().toString(36).substr(2, 8)}`
}

export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    AUTH_REQUIRED: 'API key is required. Include x-api-key header.',
    INVALID_API_KEY: 'Invalid API key. Check your credentials.',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
    DEMO_RATE_LIMIT_EXCEEDED: 'Demo rate limit exceeded. Please try again later.',
    DEMO_ORIGIN_FORBIDDEN: 'Demo access denied from this origin.',
    DEMO_ERROR: 'Demo request failed. Please try again.',
    UNSUPPORTED_OPERATION: 'Unsupported operation. Check the endpoint documentation.',
    ORIGIN_NOT_ALLOWED: 'Demo endpoint only accessible from the landing page.',
    DEMO_UNAVAILABLE: 'Demo service temporarily unavailable.',
    INVALID_URL: 'Invalid URL. Must be a valid http:// or https:// URL.',
    INVALID_PARAMS: 'Invalid parameters. Check the request format.',
    CAPTURE_FAILED: 'Failed to capture screenshot. The page may be unreachable.',
    TIMEOUT: 'Request timed out. The page took too long to load.',
    INTERNAL_ERROR: 'Internal server error. Please try again later.',
  }
  return messages[code]
}