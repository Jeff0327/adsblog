import Link from "next/link"
import type { BlogSettings } from "@/types/database.types"

interface HeaderProps {
  settings: BlogSettings | null
}

export default function Header({ settings }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
            {settings?.site_title || "The Creative Blog"}
          </h1>
        </Link>
      </div>
    </header>
  )
}