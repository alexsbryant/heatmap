"use client";

import { useState } from "react";
import { Sidebar } from "@/components/map/Sidebar";
import { Map } from "@/components/map/Map";
import { MobileHeader } from "@/components/map/MobileHeader";

export default function MapPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="relative h-screen overflow-hidden bg-stone-50">
      {/* Map takes full screen - z-0 keeps it behind overlays */}
      <div className="absolute inset-0 z-0">
        <Map />
      </div>

      {/* Sidebar overlays the map - z-10 */}
      <div className="absolute inset-y-0 left-0 z-10">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile header overlays the map - z-10 */}
      <div className="absolute inset-x-0 top-0 z-10">
        <MobileHeader />
      </div>
    </div>
  );
}
