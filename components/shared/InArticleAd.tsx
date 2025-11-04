'use client'

import { GoogleAdsense } from './GoogleAdsense'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface InArticleAdProps {
  adSlot: string | null
  className?: string
}

export function InArticleAd({ adSlot, className = '' }: InArticleAdProps) {
  if (!adSlot) {
    return null
  }

  return (
    <Card className={`my-8 overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center mb-2">
          <Badge variant="outline" className="text-xs">
            Advertisement
          </Badge>
        </div>
        <GoogleAdsense
          adSlot={adSlot}
          adFormat="fluid"
          adLayout="in-article"
          className="min-h-[200px]"
        />
      </CardContent>
    </Card>
  )
}
