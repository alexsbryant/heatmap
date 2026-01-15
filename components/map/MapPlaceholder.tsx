export function MapPlaceholder() {
  return (
    <div className="flex-1 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center relative overflow-hidden rounded-3xl m-4 ml-0 md:ml-0">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 map-grid opacity-50" />

      {/* Decorative heatmap blobs */}
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,74,0.6) 0%, rgba(255,107,74,0) 70%)",
          top: "20%",
          left: "30%",
        }}
      />
      <div
        className="absolute w-48 h-48 rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(13,148,136,0.5) 0%, rgba(13,148,136,0) 70%)",
          bottom: "30%",
          right: "25%",
        }}
      />
      <div
        className="absolute w-32 h-32 rounded-full blur-2xl opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(255,139,115,0.6) 0%, rgba(255,139,115,0) 70%)",
          top: "50%",
          left: "60%",
        }}
      />

      {/* Fake streets */}
      <div className="absolute top-[30%] left-0 right-0 h-[1px] bg-stone-300/40" />
      <div className="absolute top-[55%] left-0 right-0 h-[2px] bg-stone-300/50" />
      <div className="absolute top-[75%] left-0 right-0 h-[1px] bg-stone-300/40" />
      <div className="absolute left-[20%] top-0 bottom-0 w-[1px] bg-stone-300/40" />
      <div className="absolute left-[45%] top-0 bottom-0 w-[2px] bg-stone-300/50" />
      <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-stone-300/40" />

      {/* Center content */}
      <div className="relative text-center z-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center border border-stone-200/50">
          <svg
            className="w-10 h-10 text-accent-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-stone-700 mb-2">
          Map Loading...
        </h3>
        <p className="text-stone-500 text-sm max-w-xs mx-auto">
          Mapbox integration coming in Phase 2
        </p>

        {/* Fake zoom controls */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full hidden lg:flex flex-col gap-1">
          <button className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors border border-stone-200/50">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-stone-500 hover:text-stone-700 transition-colors border border-stone-200/50">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Corner branding */}
      <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-xs text-stone-500 font-medium border border-stone-200/50">
        San Francisco, CA
      </div>
    </div>
  );
}
