import type { BlogSettings } from "@/types/database.types"
import {getBlogSettings} from "@/app/actions";

interface FooterProps {
  settings: BlogSettings | null
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
          <div className={'flex flex-col md:flex-row items-center justify-between mb-4 gap-3'}>
              <div className={'flex flex-col w-full md:w-1/2 text-white'}>
              <h3 className={'text-2xl'}>{settings?.businessName}</h3>
              <span>{settings?.businessDescription}</span>
              </div>
              <div className={'flex w-full md:w-1/2 text-white'}>
                  {settings?.promotionGoal}
              </div>
              </div>
        <p className="text-center text-sm text-white/80">
          © {new Date().getFullYear()} {settings?.site_title || "The Creative Blog"}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}