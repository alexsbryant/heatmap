"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const cities = [
  { value: "san-francisco", label: "San Francisco", available: true },
  { value: "denver", label: "Denver", available: false },
  { value: "london", label: "London, England", available: false },
];

// Geometric pattern component echoing the prism hexagon theme
function GeometricAccent({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full opacity-[0.03]"
        fill="currentColor"
      >
        <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" />
      </svg>
    </div>
  );
}

export function Hero() {
  const router = useRouter();
  const [expandedMode, setExpandedMode] = useState<"explore" | "how-it-works" | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [selectedCity, setSelectedCity] = useState("san-francisco");

  const isExpanding = expandedMode !== null;

  const handleExplore = () => {
    setExpandedMode("explore");
    setTimeout(() => setShowContent(true), 300);
  };

  const handleHowItWorks = () => {
    setExpandedMode("how-it-works");
    setTimeout(() => setShowContent(true), 300);
  };

  const handleClose = () => {
    setShowContent(false);
    setTimeout(() => setExpandedMode(null), 100);
  };

  const handleGo = () => {
    const city = cities.find((c) => c.value === selectedCity);
    if (city?.available) {
      router.push("/map");
    }
  };

  const selectedCityData = cities.find((c) => c.value === selectedCity);

  // Staggered entrance animations
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 p-3 md:p-5 lg:p-6 overflow-hidden">
      {/* Subtle background texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Bento Grid */}
      <div
        className={`relative h-[calc(100vh-1.5rem)] md:h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-3rem)] grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 lg:gap-5 transition-all duration-700 ease-out ${
          isExpanding ? "opacity-0 scale-[0.98] pointer-events-none" : "opacity-100 scale-100"
        }`}
      >
        {/* Main Logo Card - Clean, centered hero */}
        <div
          className={`relative bg-white col-span-1 md:col-span-7 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-stone-200/80 transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {/* Decorative geometric accents */}
          <GeometricAccent className="w-64 h-64 -top-20 -right-20 text-accent-600" />
          <GeometricAccent className="w-48 h-48 -bottom-16 -left-16 text-coral-500" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-6 md:p-10 lg:p-14">
            {/* Location badge */}
            <div
              className={`absolute top-5 left-5 md:top-7 md:left-7 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
              </span>
              <span className="text-xs font-medium text-stone-600 tracking-wide">
                San Francisco
              </span>
            </div>

            {/* Main Logo */}
            <div
              className={`relative transition-all duration-1000 ease-out delay-100 ${
                mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <Image
                src="/prism-logo.png"
                alt="Prism - City Vibes, Mapped"
                width={340}
                height={340}
                className="w-[260px] md:w-[320px] lg:w-[380px] h-auto"
                priority
              />
            </div>

            {/* Subtle tagline beneath logo */}
            <p
              className={`mt-6 md:mt-8 text-stone-400 text-sm md:text-base tracking-wide transition-all duration-700 delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              Discover your city&apos;s energy
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-1 md:col-span-5 grid grid-rows-[1fr_1fr] gap-3 md:gap-4 lg:gap-5">
          {/* Top Right - How it Works Card */}
          <button
            onClick={handleHowItWorks}
            className={`relative bg-stone-900 text-white rounded-2xl md:rounded-3xl p-5 md:p-7 lg:p-8 flex flex-col justify-between overflow-hidden cursor-pointer group transition-all duration-300 ease-out delay-150 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            } hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/30 hover:scale-[1.02] active:scale-[0.98]`}
          >
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background: 'radial-gradient(ellipse at top right, rgba(13,148,136,0.15) 0%, transparent 60%)'
              }}
            />

            {/* Animated gradient on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)'
              }}
            />

            <div className="relative flex items-start justify-between">
              <span className="text-stone-500 text-xs md:text-sm font-medium tracking-widest uppercase">
                How it works
              </span>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-4 h-4 text-stone-400 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>

            <div className="relative mt-auto text-left">
              <p className="text-xl md:text-2xl lg:text-3xl font-display font-semibold leading-snug tracking-tight">
                Find neighborhoods
                <br />
                <span className="text-gradient">that match your mood</span>
              </p>
              <div className="mt-4 flex items-center gap-3 text-stone-500 text-xs md:text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-400" />
                  Nightlife
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                  Chill spots
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Hidden gems
                </span>
              </div>
            </div>
          </button>

          {/* Bottom Right - CTA Card */}
          <button
            onClick={handleExplore}
            className={`relative bg-coral-500 text-white rounded-2xl md:rounded-3xl p-5 md:p-7 lg:p-8 flex flex-col justify-between overflow-hidden cursor-pointer group transition-all duration-300 ease-out ${
              mounted
                ? "opacity-100 translate-y-0 delay-300"
                : "opacity-0 translate-y-6"
            } hover:bg-coral-600 hover:shadow-xl hover:shadow-coral-500/20 hover:scale-[1.02] active:scale-[0.98]`}
          >
            {/* Animated gradient on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)'
              }}
            />

            <div className="relative flex items-start justify-between">
              <span className="text-coral-200 text-xs md:text-sm font-medium tracking-widest uppercase">
                Ready?
              </span>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-white transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>

            <div className="relative mt-auto">
              <p className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                Let&apos;s Go
              </p>
              <p className="mt-2 text-coral-100 text-xs md:text-sm">
                Tap to explore the city
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Expanded State - Full Screen Coral (Explore) */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-coral-500 to-coral-600 z-50 flex items-center justify-center transition-all duration-700 ease-out ${
          expandedMode === "explore"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Decorative geometric patterns */}
        <GeometricAccent className="w-96 h-96 -top-32 -left-32 text-white opacity-10" />
        <GeometricAccent className="w-64 h-64 -bottom-20 -right-20 text-white opacity-10" />
        <GeometricAccent className="w-48 h-48 top-1/4 right-1/4 text-white opacity-5" />

        <div
          className={`relative text-center px-6 transition-all duration-500 delay-300 ${
            showContent && expandedMode === "explore"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-10 tracking-tight">
            Where to?
          </h2>

          <div className="max-w-sm mx-auto space-y-5">
            <div className="relative group">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white text-lg font-medium border border-white/25 focus:outline-none focus:border-white/50 focus:bg-white/20 appearance-none cursor-pointer hover:bg-white/20 transition-all duration-300"
              >
                {cities.map((city) => (
                  <option
                    key={city.value}
                    value={city.value}
                    className="text-stone-900 bg-white"
                  >
                    {city.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white/70 group-hover:text-white transition-colors"
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
              </div>
            </div>

            <button
              onClick={handleGo}
              disabled={!selectedCityData?.available}
              className={`w-full px-6 py-4 rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl shadow-coral-900/20 ${
                selectedCityData?.available
                  ? "bg-white text-coral-600 hover:bg-coral-50 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-white/50 text-coral-400 cursor-not-allowed"
              }`}
            >
              {selectedCityData?.available
                ? `Explore ${selectedCityData?.label}`
                : `${selectedCityData?.label} Coming Soon...`}
            </button>

            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors duration-300 mt-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go back
            </button>
          </div>
        </div>
      </div>

      {/* Expanded State - Full Screen Dark (How it Works) */}
      <div
        className={`fixed inset-0 bg-gradient-to-br from-stone-900 to-stone-800 z-50 flex items-center justify-center transition-all duration-700 ease-out ${
          expandedMode === "how-it-works"
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Decorative geometric patterns */}
        <GeometricAccent className="w-96 h-96 -top-32 -left-32 text-accent-500 opacity-20" />
        <GeometricAccent className="w-64 h-64 -bottom-20 -right-20 text-accent-500 opacity-20" />
        <GeometricAccent className="w-48 h-48 top-1/4 right-1/4 text-accent-500 opacity-10" />

        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(13,148,136,0.2) 0%, transparent 60%)'
          }}
        />

        <div
          className={`relative text-center px-6 max-w-lg transition-all duration-500 delay-300 ${
            showContent && expandedMode === "how-it-works"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight">
            How it works
          </h2>

          <p className="text-stone-300 text-base md:text-lg leading-relaxed mb-8">
            We&apos;ve curated the vibes of cities so you don&apos;t get a list of locations,
            you get the feel of neighbourhoods. By working through reviews and locations,
            we let you know which areas to explore. Whether you want a dive bar crawl,
            a locals only art scene, or the best pics for your insta feed.
          </p>

          <div className="space-y-3 mb-10">
            <div className="flex items-center gap-3 justify-center text-white">
              <span className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 font-bold text-sm">1</span>
              <span className="text-stone-200">Select city</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-white">
              <span className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 font-bold text-sm">2</span>
              <span className="text-stone-200">Choose vibes</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-white">
              <span className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-400 font-bold text-sm">3</span>
              <span className="text-stone-200">See the heatmap</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-sm transition-colors duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
