"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, List } from "lucide-react";

interface CalendarViewToggleProps {
  view: "grid" | "timeline";
  onViewChange: (view: "grid" | "timeline") => void;
}

export function CalendarViewToggle({ view, onViewChange }: CalendarViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className="h-8 px-3"
      >
        <CalendarDays className="h-4 w-4 mr-1.5" />
        Grid
      </Button>
      <Button
        variant={view === "timeline" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("timeline")}
        className="h-8 px-3"
      >
        <List className="h-4 w-4 mr-1.5" />
        Timeline
      </Button>
    </div>
  );
}
