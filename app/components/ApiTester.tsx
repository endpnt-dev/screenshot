'use client'

import { useState } from 'react'
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface ApiResponse {
  success: boolean
  data?: {
    image: string
    width: number
    height: number
    format: string
    file_size_bytes: number
  }
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

export default function ApiTester() {
  const [params, setParams] = useState({
    url: 'https://example.com',
    format: 'png',
    width: 1280,
    height: 720,
    full_page: false,
    wait_for: 0,
    selector: '',
    quality: 80,
    dark_mode: false,
    device: 'desktop'
  })

  const [apiKey, setApiKey] = useState('ek_live_demo123')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const cleanParams = {
        ...params,
        width: Number(params.width) || 1280,
        height: Number(params.height) || 720,
        wait_for: Number(params.wait_for) || 0,
        quality: Number(params.quality) || 80,
        selector: params.selector.trim() || undefined
      }

      // Remove empty/default values
      Object.keys(cleanParams).forEach(key => {
        const value = cleanParams[key as keyof typeof cleanParams]
        if (value === '' || value === undefined ||
            (key === 'wait_for' && value === 0) ||
            (key === 'selector' && !value)) {
          delete cleanParams[key as keyof typeof cleanParams]
        }
      })

      const response = await fetch('/api/v1/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(cleanParams)
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

  return (
    <div className="space-y-6">
      <div className="bg-muted rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Interactive API Tester</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ek_live_demo123"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none font-mono text-sm"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <input
              type="url"
              value={params.url}
              onChange={(e) => setParams(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select
                value={params.format}
                onChange={(e) => setParams(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {/* Device */}
            <div>
              <label className="block text-sm font-medium mb-1">Device</label>
              <select
                value={params.device}
                onChange={(e) => setParams(prev => ({ ...prev, device: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-medium mb-1">Width (px)</label>
              <input
                type="number"
                value={params.width}
                onChange={(e) => setParams(prev => ({ ...prev, width: Number(e.target.value) }))}
                min="320"
                max="3840"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium mb-1">Height (px)</label>
              <input
                type="number"
                value={params.height}
                onChange={(e) => setParams(prev => ({ ...prev, height: Number(e.target.value) }))}
                min="320"
                max="2160"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              />
            </div>

            {/* Wait For */}
            <div>
              <label className="block text-sm font-medium mb-1">Wait For (ms)</label>
              <input
                type="number"
                value={params.wait_for}
                onChange={(e) => setParams(prev => ({ ...prev, wait_for: Number(e.target.value) }))}
                min="0"
                max="10000"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              />
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium mb-1">Quality (JPEG/WebP)</label>
              <input
                type="number"
                value={params.quality}
                onChange={(e) => setParams(prev => ({ ...prev, quality: Number(e.target.value) }))}
                min="1"
                max="100"
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* CSS Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">CSS Selector (optional)</label>
            <input
              type="text"
              value={params.selector}
              onChange={(e) => setParams(prev => ({ ...prev, selector: e.target.value }))}
              placeholder="e.g., .main-content, #hero"
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none font-mono text-sm"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.full_page}
                onChange={(e) => setParams(prev => ({ ...prev, full_page: e.target.checked }))}
                className="rounded border-border text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm">Full page capture</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.dark_mode}
                onChange={(e) => setParams(prev => ({ ...prev, dark_mode: e.target.checked }))}
                className="rounded border-border text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm">Dark mode</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !params.url.trim()}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* Response */}
      {result && (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <h4 className="font-medium">
                API Response ({result.success ? 'Success' : 'Error'})
              </h4>
            </div>

            <pre className="bg-background p-4 rounded-md overflow-x-auto text-sm font-mono border border-border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {/* Screenshot Preview */}
          {result.success && result.data && (
            <div className="bg-muted rounded-lg p-6">
              <h4 className="font-medium mb-4">Screenshot Preview</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {result.data.width} × {result.data.height} • {result.data.format.toUpperCase()} • {Math.round(result.data.file_size_bytes / 1024)}KB
                  {result.meta?.processing_ms && ` • ${result.meta.processing_ms}ms`}
                </div>
                <div className="border border-border rounded-lg overflow-hidden bg-white max-w-2xl">
                  <img
                    src={`data:image/${result.data.format};base64,${result.data.image}`}
                    alt="Screenshot result"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}