'use client'

import { useState } from 'react'
import { Camera, Loader2, AlertCircle } from 'lucide-react'

interface ScreenshotResult {
  image: string
  width: number
  height: number
  format: string
  file_size_bytes: number
}

interface ApiResponse {
  success: boolean
  data?: ScreenshotResult
  error?: {
    code: string
    message: string
  }
  meta?: {
    request_id?: string
    processing_ms?: number
    remaining_credits?: number
  }
}

export default function ScreenshotDemo() {
  const [url, setUrl] = useState('https://example.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)

  const captureScreenshot = async () => {
    if (!url.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/v1/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ek_live_74qlNSbK5jTwq28Y'
        },
        body: JSON.stringify({
          url: url.trim(),
          width: 1280,
          height: 720,
          format: 'png'
        })
      })

      const data: ApiResponse = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to the API'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    captureScreenshot()
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-muted rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary-600" />
          Try it live
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL to screenshot..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Capture
                </>
              )}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6">
            {result.success && result.data ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {result.data.width} × {result.data.height} • {result.data.format.toUpperCase()} • {Math.round(result.data.file_size_bytes / 1024)}KB
                  </span>
                  {result.meta?.processing_ms && (
                    <span>{result.meta.processing_ms}ms</span>
                  )}
                </div>
                <div className="border border-border rounded-lg overflow-hidden bg-white">
                  <img
                    src={`data:image/${result.data.format};base64,${result.data.image}`}
                    alt={`Screenshot of ${url}`}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-lg text-red-200">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-medium">Error</div>
                  <div className="text-sm opacity-80">
                    {result.error?.message || 'An unexpected error occurred'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}