"use client";

import { useMemo } from "react";
import { DollarSign, Gift, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/actions/calendar";

interface CalendarTimelineProps {
  events: CalendarEvent[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case "closed":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "open":
      return <Clock className="h-4 w-4 text-warning" />;
    case "upcoming":
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "closed":
      return "success" as const;
    case "open":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export function CalendarTimeline({ events }: CalendarTimelineProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group events by cycle and sort
  const groupedEvents = useMemo(() => {
    const cycleMap = new Map<
      number,
      {
        cycleNumber: number;
        date: string;
        status: string;
        contribution: CalendarEvent | null;
        payout: CalendarEvent | null;
      }
    >();

    events.forEach((event) => {
      if (!cycleMap.has(event.cycleNumber)) {
        cycleMap.set(event.cycleNumber, {
          cycleNumber: event.cycleNumber,
          date: event.date,
          status: event.status,
          contribution: null,
          payout: null,
        });
      }
      const cycle = cycleMap.get(event.cycleNumber)!;
      if (event.type === "contribution_due") {
        cycle.contribution = event;
      } else {
        cycle.payout = event;
      }
    });

    return Array.from(cycleMap.values()).sort(
      (a, b) => a.cycleNumber - b.cycleNumber
    );
  }, [events]);

  if (groupedEvents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No cycles scheduled yet</h3>
          <p className="text-muted-foreground text-sm">
            Cycles will appear here once the branch starts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current/Next payout highlight */}
      {groupedEvents.some((g) => g.status === "open") && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            {(() => {
              const current = groupedEvents.find((g) => g.status === "open");
              if (!current) return null;
              return (
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Current Cycle {current.cycleNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(current.date)}
                      </p>
                    </div>
                  </div>
                  {current.payout?.payoutUser && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={current.payout.payoutUser.photo_url || ""} />
                        <AvatarFallback className="text-xs">
                          {getInitials(current.payout.payoutUser.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {current.payout.payoutUser.name}
                          {current.payout.isUserPayout && (
                            <Badge variant="success" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          receives {formatCurrency(current.payout.amount)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {groupedEvents.map((group, index) => {
            const eventDate = new Date(group.date);
            eventDate.setHours(0, 0, 0, 0);
            const isPast = eventDate < today;
            const isCurrent = group.status === "open";

            return (
              <div key={group.cycleNumber} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-2 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isCurrent
                      ? "bg-primary border-primary"
                      : isPast
                        ? "bg-success border-success"
                        : "bg-background border-muted-foreground"
                  )}
                >
                  {isPast && <CheckCircle className="h-3 w-3 text-white" />}
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>

                <Card
                  className={cn(
                    "transition-all",
                    isCurrent && "border-primary shadow-md",
                    isPast && "opacity-75"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Cycle {group.cycleNumber}</h3>
                          <Badge variant={getStatusBadgeVariant(group.status)}>
                            {group.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(group.date)}
                        </p>
                      </div>

                      {group.payout?.payoutUser && (
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={group.payout.payoutUser.photo_url || ""} />
                            <AvatarFallback>
                              {getInitials(group.payout.payoutUser.name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Gift className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm font-medium">
                                {group.payout.payoutUser.name}
                                {group.payout.isUserPayout && " (You)"}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                group.payout.isUserPayout ? "text-success" : "text-primary"
                              )}
                            >
                              {formatCurrency(group.payout.amount)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contribution info */}
                    {group.contribution && (
                      <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          Each member contributes{" "}
                          {formatCurrency(group.contribution.amount)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
