export const API_VERSION = '1.0.0'

export const TIER_LIMITS = {
  free: {
    requests_per_minute: 10,
    requests_per_month: 100
  },
  starter: {
    requests_per_minute: 60,
    requests_per_month: 5000
  },
  pro: {
    requests_per_minute: 300,
    requests_per_month: 25000
  },
  enterprise: {
    requests_per_minute: 1000,
    requests_per_month: 100000
  },
} as const

export const DEVICE_PRESETS = {
  desktop: {
    width: 1280,
    height: 720,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  },
  mobile: {
    width: 390,
    height: 844,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  tablet: {
    width: 820,
    height: 1180,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
} as const

export const SCREENSHOT_DEFAULTS = {
  format: 'png' as const,
  width: 1280,
  height: 720,
  full_page: false,
  wait_for: 0,
  quality: 80,
  dark_mode: false,
  device: 'desktop' as const,
}

export const DEMO_RATE_LIMIT = {
  requests_per_window: 20,
  window_minutes: 10
} as const

export const VALIDATION_LIMITS = {
  width: { min: 320, max: 3840 },
  height: { min: 320, max: 2160 },
  wait_for: { min: 0, max: 10000 },
  quality: { min: 1, max: 100 },
}

export const SUPPORTED_FORMATS = ['png', 'jpeg', 'pdf'] as const

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DEMO_RATE_LIMIT_EXCEEDED: 'DEMO_RATE_LIMIT_EXCEEDED',
  DEMO_ORIGIN_FORBIDDEN: 'DEMO_ORIGIN_FORBIDDEN',
  DEMO_ERROR: 'DEMO_ERROR',
  UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
  ORIGIN_NOT_ALLOWED: 'ORIGIN_NOT_ALLOWED',
  DEMO_UNAVAILABLE: 'DEMO_UNAVAILABLE',
  INVALID_URL: 'INVALID_URL',
  INVALID_PARAMS: 'INVALID_PARAMS',
  CAPTURE_FAILED: 'CAPTURE_FAILED',
  TIMEOUT: 'TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type DevicePreset = keyof typeof DEVICE_PRESETS
export type ScreenshotFormat = typeof SUPPORTED_FORMATS[number]
export type ApiTier = keyof typeof TIER_LIMITS
export type ErrorCode = keyof typeof ERROR_CODES