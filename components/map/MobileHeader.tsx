"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileHeader() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200/60">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="font-display text-lg font-bold text-stone-900"
          >
            Prism
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">San Francisco</span>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
              aria-label="Open menu"
            >
              <svg
                className="w-5 h-5 text-stone-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-30 transition-opacity duration-300 ${
          isDrawerOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-40 shadow-2xl transition-transform duration-300 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-stone-900">
            Filters
          </h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5 text-stone-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
          {/* City Section */}
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-accent-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                  City
                </p>
                <p className="text-stone-900 font-semibold">San Francisco</p>
              </div>
            </div>
            <p className="text-sm text-stone-500">
              Exploring the Bay Area&apos;s most vibrant neighborhoods
            </p>
          </div>

          {/* Vibes Section */}
          <div className="rounded-2xl bg-stone-50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-coral-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                  Vibes
                </p>
                <p className="text-stone-900 font-semibold">Select mood</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { name: "Night Out", icon: "🌙" },
                { name: "Chill Vibes", icon: "☕" },
                { name: "Hidden Gems", icon: "💎" },
                { name: "Trendy", icon: "✨" },
              ].map((vibe) => (
                <button
                  key={vibe.name}
                  className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium bg-white text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors"
                >
                  <span className="mr-2">{vibe.icon}</span>
                  {vibe.name}
                </button>
              ))}
              <p className="text-xs text-stone-400 pt-2 text-center">
                More vibes coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
