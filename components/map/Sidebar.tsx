"use client";

import { useState } from "react";
import Link from "next/link";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("vibes");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleCollapsedClick = (section: string) => {
    setExpandedSection(section);
    onToggle();
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200/60 m-4 transition-all duration-500 ease-out overflow-hidden z-10 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
      style={{ height: "calc(100vh - 2rem)" }}
    >
      {/* Header */}
      <div className="px-3 py-4 border-b border-stone-100 flex items-center justify-between min-h-[64px]">
        <Link
          href="/"
          className={`font-display text-xl font-bold text-stone-900 hover:text-accent-600 transition-all duration-300 whitespace-nowrap ${
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          }`}
        >
          Prism
        </Link>
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors group flex-shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 text-stone-500 group-hover:text-stone-700 transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 relative">
        {/* Collapsed Icons - absolutely positioned */}
        <div
          className={`absolute inset-x-0 top-0 p-3 flex flex-col items-center space-y-3 transition-opacity duration-300 ${
            isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* City Icon - Collapsed */}
          <button
            onClick={() => handleCollapsedClick("city")}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <svg
              className="w-4 h-4 text-accent-600"
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
          </button>

          {/* Vibes Icon - Collapsed */}
          <button
            onClick={() => handleCollapsedClick("vibes")}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <svg
              className="w-4 h-4 text-coral-600"
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
          </button>
        </div>

        {/* Expanded Content - fixed width to prevent reflow */}
        <div
          className={`space-y-2 transition-opacity duration-300 ${
            isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ width: "280px" }} /* w-80 (320px) - p-3*2 (24px) - scrollbar (16px) */
        >
          {/* City Section - Expanded */}
          <div className="rounded-2xl bg-stone-50 overflow-hidden">
            <button
              onClick={() => toggleSection("city")}
              className="w-full p-4 flex items-center justify-between hover:bg-stone-100 transition-colors rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
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
                <div className="text-left whitespace-nowrap">
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                    City
                  </p>
                  <p className="text-stone-900 font-semibold">San Francisco</p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                  expandedSection === "city" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSection === "city" && (
              <div className="px-4 pb-4 pt-1">
                <p className="text-sm text-stone-500">
                  Exploring the Bay Area&apos;s most vibrant neighborhoods
                </p>
              </div>
            )}
          </div>

          {/* Vibes Section - Expanded */}
          <div className="rounded-2xl bg-stone-50 overflow-hidden">
            <button
              onClick={() => toggleSection("vibes")}
              className="w-full p-4 flex items-center justify-between hover:bg-stone-100 transition-colors rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center flex-shrink-0">
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
                <div className="text-left whitespace-nowrap">
                  <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                    Vibes
                  </p>
                  <p className="text-stone-900 font-semibold">Select mood</p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                  expandedSection === "vibes" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedSection === "vibes" && (
              <div className="px-4 pb-4 pt-1 space-y-2">
                {[
                  { name: "Night Out", icon: "🌙", active: false },
                  { name: "Chill Vibes", icon: "☕", active: false },
                  { name: "Hidden Gems", icon: "💎", active: false },
                  { name: "Trendy", icon: "✨", active: false },
                ].map((vibe) => (
                  <button
                    key={vibe.name}
                    className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all whitespace-nowrap ${
                      vibe.active
                        ? "bg-accent-600 text-white"
                        : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    <span className="mr-2">{vibe.icon}</span>
                    {vibe.name}
                  </button>
                ))}
                <p className="text-xs text-stone-400 pt-2 text-center">
                  More vibes coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`p-3 border-t border-stone-100 transition-opacity duration-300 ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-xs text-stone-400 text-center whitespace-nowrap">
          Select vibes to see which areas light up
        </p>
      </div>
    </aside>
  );
}
