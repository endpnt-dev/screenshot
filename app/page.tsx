export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 font-mono">
            Screenshot API
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Capture any webpage with one API call
          </p>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
            <pre className="text-sm text-green-400 overflow-x-auto">
{`curl -X POST https://screenshot.endpnt.dev/api/v1/capture \\
  -H "x-api-key: ek_live_demo123" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}