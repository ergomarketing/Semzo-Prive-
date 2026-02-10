"use client"

import type React from "react"

import { useRef } from "react"

export function BlogScrollContainer({ children }: { children: React.ReactNode }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: "smooth" })
    }
  }

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Scroll left"
      >
        <svg className="w-6 h-6 text-indigo-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Scroll right"
      >
        <svg className="w-6 h-6 text-indigo-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div ref={scrollContainerRef} className="overflow-x-auto -mx-4 px-4 scroll-smooth scrollbar-hide">
        <div className="flex gap-4 md:gap-6 pb-4">{children}</div>
      </div>
    </div>
  )
}
