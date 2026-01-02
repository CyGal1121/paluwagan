"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/actions/calendar";

interface CalendarGridProps {
  events: CalendarEvent[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarGrid({ events }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = event.date.split("T")[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {MONTHS[month]} {year}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[100px] border-b border-r bg-muted/30"
                />
              );
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate.get(dateStr) || [];
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0, 0, 0, 0);
            const isToday = cellDate.getTime() === today.getTime();
            const isPast = cellDate < today;

            return (
              <div
                key={day}
                className={cn(
                  "min-h-[100px] border-b border-r p-1.5",
                  isPast && "bg-muted/20",
                  isToday && "bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday &&
                      "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <TooltipProvider key={event.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "text-xs p-1 rounded truncate cursor-pointer",
                              event.type === "payout"
                                ? event.isUserPayout
                                  ? "bg-success/20 text-success-foreground border border-success/30"
                                  : "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              {event.type === "payout" ? (
                                <Gift className="h-3 w-3 flex-shrink-0" />
                              ) : (
                                <DollarSign className="h-3 w-3 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {event.type === "payout"
                                  ? event.payoutUser?.name?.split(" ")[0] || "Payout"
                                  : `C${event.cycleNumber}`}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {event.type === "payout"
                                ? `Payout: Cycle ${event.cycleNumber}`
                                : `Contribution Due: Cycle ${event.cycleNumber}`}
                            </p>
                            <p className="text-sm">
                              Amount: {formatCurrency(event.amount)}
                            </p>
                            {event.payoutUser && (
                              <div className="flex items-center gap-2 mt-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={event.payoutUser.photo_url || ""} />
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(event.payoutUser.name || "?")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {event.payoutUser.name}
                                  {event.isUserPayout && " (You)"}
                                </span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs mt-1">
                              {event.status}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Contribution Due</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
          <span>Payout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
          <span>Your Payout</span>
        </div>
      </div>
    </div>
  );
}
