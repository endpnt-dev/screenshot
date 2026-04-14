import Link from 'next/link'
import { Camera, Smartphone, Palette, Target, Image, Zap, ArrowRight, Code, Github } from 'lucide-react'
import CodeBlock from './components/CodeBlock'
import ScreenshotDemo from './components/ScreenshotDemo'

const features = [
  {
    icon: Camera,
    title: 'Full-page capture',
    description: 'Capture entire scrollable pages, not just the visible viewport'
  },
  {
    icon: Smartphone,
    title: 'Device emulation',
    description: 'Desktop, mobile, and tablet presets with accurate user agents'
  },
  {
    icon: Palette,
    title: 'Dark mode support',
    description: 'Automatically trigger dark mode for supported websites'
  },
  {
    icon: Target,
    title: 'Element targeting',
    description: 'Screenshot specific page elements using CSS selectors'
  },
  {
    icon: Image,
    title: 'Multiple formats',
    description: 'PNG, JPEG, WebP, and PDF output with quality control'
  },
  {
    icon: Zap,
    title: 'Blazing fast',
    description: 'Optimized browser engine with sub-2 second response times'
  }
]

const codeExamples = {
  curl: `curl -X POST https://screenshot.endpnt.dev/api/v1/capture \\
  -H "x-api-key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "png",
    "width": 1280,
    "height": 720,
    "full_page": true
  }'`,

  javascript: `const response = await fetch('https://screenshot.endpnt.dev/api/v1/capture', {
  method: 'POST',
  headers: {
    'x-api-key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    format: 'png',
    width: 1280,
    height: 720,
    full_page: true
  })
});

const result = await response.json();
if (result.success) {
  const imageData = result.data.image; // base64 encoded
}`,

  python: `import requests
import base64

url = "https://screenshot.endpnt.dev/api/v1/capture"
headers = {
    "x-api-key": "your_api_key",
    "Content-Type": "application/json"
}
data = {
    "url": "https://example.com",
    "format": "png",
    "width": 1280,
    "height": 720,
    "full_page": True
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result["success"]:
    image_data = base64.b64decode(result["data"]["image"])
    with open("screenshot.png", "wb") as f:
        f.write(image_data)`
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-mono font-bold">Screenshot API</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm hover:text-primary-600 transition-colors">
              Docs
            </Link>
            <Link href="/pricing" className="text-sm hover:text-primary-600 transition-colors">
              Pricing
            </Link>
            <Link
              href="https://github.com/endpnt-dev/screenshot"
              className="text-sm hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Screenshot any webpage
                <br />
                <span className="text-primary-600">with one API call</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Fast, reliable screenshot API with device emulation, dark mode, and multiple formats.
                Perfect for automation, testing, and content generation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Code className="h-4 w-4" />
                View docs
              </Link>
            </div>

            {/* Quick example */}
            <div className="max-w-2xl mx-auto">
              <CodeBlock
                code={codeExamples.curl}
                language="bash"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful features for every use case</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with modern web standards and optimized for speed, reliability, and ease of use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-primary-600/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Try it yourself</h2>
            <p className="text-muted-foreground text-lg">
              Paste any URL below and see the API in action
            </p>
          </div>

          <ScreenshotDemo />
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Easy integration</h2>
            <p className="text-muted-foreground text-lg">
              Works with any programming language that can make HTTP requests
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">JavaScript</h3>
                <CodeBlock
                  code={codeExamples.javascript}
                  language="javascript"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Python</h3>
                <CodeBlock
                  code={codeExamples.python}
                  language="python"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of developers using our Screenshot API for automation, testing, and content generation.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium text-lg"
            >
              Get your free API key
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary-600" />
                <span className="font-mono font-bold">Screenshot API</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Fast, reliable screenshot API for developers.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Product</h4>
              <div className="space-y-2">
                <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
                <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
                <Link href="/api/v1/health" className="block text-sm text-muted-foreground hover:text-foreground">
                  Status
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Resources</h4>
              <div className="space-y-2">
                <Link href="https://github.com/endpnt-dev/screenshot" className="block text-sm text-muted-foreground hover:text-foreground">
                  GitHub
                </Link>
                <Link href="https://endpnt.dev" className="block text-sm text-muted-foreground hover:text-foreground">
                  endpnt.dev
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Support</h4>
              <div className="space-y-2">
                <a href="mailto:support@endpnt.dev" className="block text-sm text-muted-foreground hover:text-foreground">
                  Email Support
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2026 endpnt.dev. Built with Next.js and deployed on Vercel.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}