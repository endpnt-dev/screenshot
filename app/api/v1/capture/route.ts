import { NextRequest } from 'next/server'
import { successResponse, errorResponse, generateRequestId, getErrorMessage } from '@/lib/response'
import { validateApiKey, getApiKeyFromHeaders } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { takeScreenshot, ScreenshotOptions } from '@/lib/screenshot'
import { ERROR_CODES } from '@/lib/config'

interface RequestParams {
  url?: string
  format?: string
  width?: string | number
  height?: string | number
  full_page?: string | boolean
  wait_for?: string | number
  selector?: string
  quality?: string | number
  dark_mode?: string | boolean
  device?: string
}

function parseScreenshotParams(params: RequestParams): ScreenshotOptions {
  if (!params.url) {
    throw new Error('url parameter is required')
  }

  const options: ScreenshotOptions = {
    url: params.url,
  }

  // Parse format
  if (params.format) {
    options.format = params.format as any
  }

  // Parse numeric parameters
  if (params.width !== undefined) {
    const width = typeof params.width === 'string' ? parseInt(params.width) : params.width
    if (isNaN(width)) throw new Error('width must be a number')
    options.width = width
  }

  if (params.height !== undefined) {
    const height = typeof params.height === 'string' ? parseInt(params.height) : params.height
    if (isNaN(height)) throw new Error('height must be a number')
    options.height = height
  }

  if (params.wait_for !== undefined) {
    const waitFor = typeof params.wait_for === 'string' ? parseInt(params.wait_for) : params.wait_for
    if (isNaN(waitFor)) throw new Error('wait_for must be a number')
    options.wait_for = waitFor
  }

  if (params.quality !== undefined) {
    const quality = typeof params.quality === 'string' ? parseInt(params.quality) : params.quality
    if (isNaN(quality)) throw new Error('quality must be a number')
    options.quality = quality
  }

  // Parse boolean parameters
  if (params.full_page !== undefined) {
    if (typeof params.full_page === 'string') {
      options.full_page = params.full_page === 'true'
    } else {
      options.full_page = Boolean(params.full_page)
    }
  }

  if (params.dark_mode !== undefined) {
    if (typeof params.dark_mode === 'string') {
      options.dark_mode = params.dark_mode === 'true'
    } else {
      options.dark_mode = Boolean(params.dark_mode)
    }
  }

  // Parse string parameters
  if (params.selector) {
    options.selector = params.selector
  }

  if (params.device) {
    options.device = params.device as any
  }

  return options
}

async function handleScreenshotRequest(request: NextRequest): Promise<Response> {
  const startTime = Date.now()
  const requestId = generateRequestId()

  try {
    // 1. Validate API key
    const apiKey = getApiKeyFromHeaders(request.headers)
    if (!apiKey) {
      return errorResponse(
        ERROR_CODES.AUTH_REQUIRED,
        getErrorMessage(ERROR_CODES.AUTH_REQUIRED),
        401
      )
    }

    const keyInfo = validateApiKey(apiKey)
    if (!keyInfo) {
      return errorResponse(
        ERROR_CODES.INVALID_API_KEY,
        getErrorMessage(ERROR_CODES.INVALID_API_KEY),
        401
      )
    }

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(apiKey, keyInfo.tier)
    if (!rateLimitResult.allowed) {
      return errorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        getErrorMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
        429,
        {
          request_id: requestId,
          remaining_credits: rateLimitResult.remaining,
        }
      )
    }

    // 3. Parse parameters
    let params: RequestParams

    if (request.method === 'GET') {
      const url = new URL(request.url)
      params = Object.fromEntries(url.searchParams.entries())
    } else {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        params = await request.json()
      } else {
        const formData = await request.formData()
        params = Object.fromEntries(formData.entries())
      }
    }

    const screenshotOptions = parseScreenshotParams(params)

    // 4. Take screenshot
    const result = await takeScreenshot(screenshotOptions)

    const processingTime = Date.now() - startTime

    return successResponse(
      result,
      {
        request_id: requestId,
        processing_ms: processingTime,
        remaining_credits: rateLimitResult.remaining - 1,
      }
    )
  } catch (error) {
    console.error('Screenshot API error:', error)

    const processingTime = Date.now() - startTime

    if (error instanceof Error) {
      const message = error.message

      // Determine error type based on message
      if (message.includes('Invalid URL') || message.includes('URL')) {
        return errorResponse(
          ERROR_CODES.INVALID_URL,
          message,
          400,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (
        message.includes('must be') ||
        message.includes('required') ||
        message.includes('Format') ||
        message.includes('Device')
      ) {
        return errorResponse(
          ERROR_CODES.INVALID_PARAMS,
          message,
          400,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (message.includes('timeout') || message.includes('Timeout')) {
        return errorResponse(
          ERROR_CODES.TIMEOUT,
          getErrorMessage(ERROR_CODES.TIMEOUT),
          504,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      if (message.includes('Element not found') || message.includes('Failed to capture')) {
        return errorResponse(
          ERROR_CODES.CAPTURE_FAILED,
          message,
          500,
          { request_id: requestId, processing_ms: processingTime }
        )
      }

      // Check for Chromium launch failures (common during rapid requests/cold starts)
      if (
        message.includes('Failed to launch') ||
        message.includes('browser') ||
        message.includes('executable') ||
        message.includes('spawn') ||
        message.includes('ENOENT')
      ) {
        return errorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          'Server temporarily overloaded. Please retry in a moment.',
          503,
          { request_id: requestId, processing_ms: processingTime }
        )
      }
    }

    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      getErrorMessage(ERROR_CODES.INTERNAL_ERROR),
      500,
      { request_id: requestId, processing_ms: processingTime }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleScreenshotRequest(request)
}

export async function POST(request: NextRequest) {
  return handleScreenshotRequest(request)
}