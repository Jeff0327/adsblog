'use client'

import { GoogleAdsense } from './GoogleAdsense'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AdSidebarProps {
  adSlot: string | null
  className?: string
}

export function AdSidebar({ adSlot, className = '' }: AdSidebarProps) {
  if (!adSlot) {
    return null
  }

  return (
    <aside className={`space-y-6 ${className}`}>
      {/* Advertisement Label */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Advertisement</CardTitle>
            <Badge variant="outline" className="text-xs">
              Sponsored
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <GoogleAdsense
            adSlot={adSlot}
            adFormat="vertical"
            className="min-h-[600px]"
          />
        </CardContent>
      </Card>

      {/* Additional Ad Unit (optional) */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <GoogleAdsense
            adSlot={adSlot}
            adFormat="rectangle"
            className="min-h-[250px]"
          />
        </CardContent>
      </Card>
    </aside>
  )
}
