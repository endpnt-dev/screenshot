import { chromium, Browser, Page } from 'playwright-core'
import chromium_min from '@sparticuz/chromium'
import {
  DEVICE_PRESETS,
  SCREENSHOT_DEFAULTS,
  VALIDATION_LIMITS,
  SUPPORTED_FORMATS,
  DevicePreset,
  ScreenshotFormat,
} from './config'

export interface ScreenshotOptions {
  url: string
  format?: ScreenshotFormat
  width?: number
  height?: number
  full_page?: boolean
  wait_for?: number
  selector?: string
  quality?: number
  dark_mode?: boolean
  device?: DevicePreset
}

export interface ScreenshotResult {
  image: string // base64 encoded
  width: number
  height: number
  format: ScreenshotFormat
  file_size_bytes: number
}

function validateUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required')
  }

  const trimmedUrl = url.trim()
  if (!trimmedUrl) {
    throw new Error('URL cannot be empty')
  }

  // Auto-prepend https:// if no protocol
  let finalUrl = trimmedUrl
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = `https://${finalUrl}`
  }

  try {
    const parsedUrl = new URL(finalUrl)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('URL must use http:// or https:// protocol')
    }
    return finalUrl
  } catch {
    throw new Error('Invalid URL format')
  }
}

function validateOptions(options: ScreenshotOptions): void {
  const { width, height, wait_for, quality, format, device } = options

  if (width !== undefined) {
    if (width < VALIDATION_LIMITS.width.min || width > VALIDATION_LIMITS.width.max) {
      throw new Error(
        `Width must be between ${VALIDATION_LIMITS.width.min} and ${VALIDATION_LIMITS.width.max} pixels`
      )
    }
  }

  if (height !== undefined) {
    if (height < VALIDATION_LIMITS.height.min || height > VALIDATION_LIMITS.height.max) {
      throw new Error(
        `Height must be between ${VALIDATION_LIMITS.height.min} and ${VALIDATION_LIMITS.height.max} pixels`
      )
    }
  }

  if (wait_for !== undefined) {
    if (wait_for < VALIDATION_LIMITS.wait_for.min || wait_for > VALIDATION_LIMITS.wait_for.max) {
      throw new Error(
        `wait_for must be between ${VALIDATION_LIMITS.wait_for.min} and ${VALIDATION_LIMITS.wait_for.max} milliseconds`
      )
    }
  }

  if (quality !== undefined) {
    if (quality < VALIDATION_LIMITS.quality.min || quality > VALIDATION_LIMITS.quality.max) {
      throw new Error(
        `Quality must be between ${VALIDATION_LIMITS.quality.min} and ${VALIDATION_LIMITS.quality.max}`
      )
    }
  }

  if (format && !SUPPORTED_FORMATS.includes(format)) {
    throw new Error(
      `Format must be one of: ${SUPPORTED_FORMATS.join(', ')}`
    )
  }

  if (device && !Object.keys(DEVICE_PRESETS).includes(device)) {
    throw new Error(
      `Device must be one of: ${Object.keys(DEVICE_PRESETS).join(', ')}`
    )
  }
}

async function getBrowser(): Promise<Browser> {
  // Set up Chromium for Vercel serverless environment
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    // Use chromium for Vercel
    return await chromium.launch({
      executablePath: await chromium_min.executablePath(),
      args: chromium_min.args,
      headless: true,
    })
  } else {
    // Use system Chromium for development
    return await chromium.launch({
      headless: true,
    })
  }
}

async function setupPage(browser: Browser, options: ScreenshotOptions): Promise<Page> {
  const page = await browser.newPage()

  // Set device preset or custom dimensions
  const deviceConfig = options.device
    ? DEVICE_PRESETS[options.device]
    : {
        width: options.width ?? SCREENSHOT_DEFAULTS.width,
        height: options.height ?? SCREENSHOT_DEFAULTS.height,
        userAgent: DEVICE_PRESETS.desktop.userAgent,
      }

  await page.setViewportSize({
    width: deviceConfig.width,
    height: deviceConfig.height,
  })

  await page.setExtraHTTPHeaders({
    'User-Agent': deviceConfig.userAgent,
  })

  // Set dark mode if requested
  if (options.dark_mode) {
    await page.emulateMedia({ colorScheme: 'dark' })
  }

  return page
}

async function captureScreenshot(
  page: Page,
  options: ScreenshotOptions
): Promise<Buffer> {
  const format = options.format ?? SCREENSHOT_DEFAULTS.format

  if (format === 'pdf') {
    return await page.pdf({
      format: 'A4',
      printBackground: true,
    })
  }

  const screenshotOptions: any = {
    type: format,
    fullPage: options.full_page ?? SCREENSHOT_DEFAULTS.full_page,
  }

  if (format === 'jpeg' || format === 'webp') {
    screenshotOptions.quality = options.quality ?? SCREENSHOT_DEFAULTS.quality
  }

  if (options.selector) {
    const element = await page.locator(options.selector).first()
    const elementHandle = await element.elementHandle()

    if (!elementHandle) {
      throw new Error(`Element not found: ${options.selector}`)
    }

    return await elementHandle.screenshot(screenshotOptions)
  }

  return await page.screenshot(screenshotOptions)
}

export async function takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
  // Validate inputs
  const validatedUrl = validateUrl(options.url)
  validateOptions(options)

  let browser: Browser | null = null

  try {
    browser = await getBrowser()
    const page = await setupPage(browser, options)

    // Set timeout for page navigation
    page.setDefaultTimeout(30000)

    // Navigate to the URL
    await page.goto(validatedUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait additional time if requested
    if (options.wait_for && options.wait_for > 0) {
      await page.waitForTimeout(options.wait_for)
    }

    // Take the screenshot
    const buffer = await captureScreenshot(page, options)

    // Get viewport size for metadata
    const viewport = page.viewportSize()
    const format = options.format ?? SCREENSHOT_DEFAULTS.format

    return {
      image: buffer.toString('base64'),
      width: viewport?.width ?? SCREENSHOT_DEFAULTS.width,
      height: viewport?.height ?? SCREENSHOT_DEFAULTS.height,
      format,
      file_size_bytes: buffer.length,
    }
  } catch (error) {
    console.error('Screenshot capture failed:', error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Failed to capture screenshot')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}