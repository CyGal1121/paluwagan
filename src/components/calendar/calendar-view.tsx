"use client";

import { useState } from "react";
import { CalendarGrid } from "./calendar-grid";
import { CalendarTimeline } from "./calendar-timeline";
import { CalendarViewToggle } from "./calendar-view-toggle";
import type { CalendarEvent } from "@/lib/actions/calendar";

interface CalendarViewProps {
  events: CalendarEvent[];
  defaultView?: "grid" | "timeline";
}

export function CalendarView({ events, defaultView = "timeline" }: CalendarViewProps) {
  const [view, setView] = useState<"grid" | "timeline">(defaultView);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CalendarViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "grid" ? (
        <CalendarGrid events={events} />
      ) : (
        <CalendarTimeline events={events} />
      )}
    </div>
  );
}
