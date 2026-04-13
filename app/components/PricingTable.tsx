'use client'

import { Check, Zap } from 'lucide-react'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    billing: 'forever',
    description: 'Perfect for testing and small projects',
    requests_per_minute: 10,
    requests_per_month: 100,
    features: [
      'All image formats (PNG, JPEG, WebP, PDF)',
      'Basic viewport sizes',
      'Standard processing speed',
      'Community support'
    ],
    limitations: [
      'No custom device presets',
      'No priority processing',
      'Rate limited'
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Starter',
    price: '$29',
    billing: 'per month',
    description: 'Great for growing applications',
    requests_per_minute: 60,
    requests_per_month: 5000,
    features: [
      'Everything in Free',
      'Custom viewport sizes',
      'Device emulation presets',
      'Element targeting',
      'Dark mode support',
      'Priority processing',
      'Email support'
    ],
    limitations: [],
    buttonText: 'Start Free Trial',
    buttonVariant: 'primary' as const,
    popular: true
  },
  {
    name: 'Pro',
    price: '$99',
    billing: 'per month',
    description: 'For high-volume production apps',
    requests_per_minute: 300,
    requests_per_month: 25000,
    features: [
      'Everything in Starter',
      'Webhook notifications',
      'Batch processing',
      'Advanced wait conditions',
      'Custom quality settings',
      'Priority support',
      '99.9% SLA'
    ],
    limitations: [],
    buttonText: 'Start Free Trial',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    billing: 'contact us',
    description: 'For large-scale enterprise deployments',
    requests_per_minute: 1000,
    requests_per_month: 100000,
    features: [
      'Everything in Pro',
      'Unlimited requests available',
      'Custom rate limits',
      'Dedicated infrastructure',
      'White-label API',
      'Custom integrations',
      'Dedicated account manager',
      'Custom SLA available'
    ],
    limitations: [],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline' as const,
    popular: false
  }
]

export default function PricingTable() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`relative rounded-lg border p-6 ${
            tier.popular
              ? 'border-primary-600 bg-primary-950/30 shadow-lg'
              : 'border-border bg-muted/30'
          }`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white">
                <Zap className="h-3 w-3" />
                Most Popular
              </span>
            </div>
          )}

          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{tier.price}</span>
              <span className="text-sm text-muted-foreground">/{tier.billing}</span>
            </div>

            {/* Limits */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requests/minute</span>
                <span className="font-mono">{tier.requests_per_minute.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Requests/month</span>
                <span className="font-mono">{tier.requests_per_month.toLocaleString()}</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="space-y-2">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {tier.limitations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium">Limitations:</p>
                  {tier.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              className={`w-full py-2.5 px-4 rounded-md font-medium text-sm transition-colors ${
                tier.buttonVariant === 'primary'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {tier.buttonText}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}