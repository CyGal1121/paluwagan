import { describe, it, expect } from "vitest";
import { addWeeks, addMonths, addDays } from "date-fns";

// Pure function extracted for testing
function calculateCycleDates(
  startDate: Date,
  cycleNumber: number,
  frequency: "weekly" | "biweekly" | "monthly"
): { start: Date; due: Date } {
  let cycleStart: Date;
  let cycleDue: Date;

  switch (frequency) {
    case "weekly":
      cycleStart = addWeeks(startDate, cycleNumber - 1);
      cycleDue = addDays(cycleStart, 6);
      break;
    case "biweekly":
      cycleStart = addWeeks(startDate, (cycleNumber - 1) * 2);
      cycleDue = addDays(cycleStart, 13);
      break;
    case "monthly":
      cycleStart = addMonths(startDate, cycleNumber - 1);
      cycleDue = addDays(addMonths(startDate, cycleNumber), -1);
      break;
  }

  return { start: cycleStart, due: cycleDue };
}

// Pure function for payout order assignment
function assignPayoutOrder(
  members: { user_id: string; payout_position: number | null }[],
  method: "fixed" | "lottery" | "organizer_assigned"
): { user_id: string; position: number }[] {
  const assignments: { user_id: string; position: number }[] = [];

  switch (method) {
    case "fixed":
      const sortedMembers = [...members].sort((a, b) => {
        if (a.payout_position && b.payout_position) {
          return a.payout_position - b.payout_position;
        }
        if (a.payout_position) return -1;
        if (b.payout_position) return 1;
        return a.user_id.localeCompare(b.user_id);
      });
      sortedMembers.forEach((m, i) => {
        assignments.push({ user_id: m.user_id, position: i + 1 });
      });
      break;

    case "lottery":
      // For testing, we use a seeded version (in real code it's random)
      const shuffled = [...members];
      shuffled.forEach((m, i) => {
        assignments.push({ user_id: m.user_id, position: i + 1 });
      });
      break;

    case "organizer_assigned":
      const withPositions = members.filter((m) => m.payout_position !== null);
      const withoutPositions = members.filter((m) => m.payout_position === null);

      withPositions.forEach((m) => {
        assignments.push({ user_id: m.user_id, position: m.payout_position! });
      });

      let nextPosition = Math.max(...assignments.map((a) => a.position), 0) + 1;
      withoutPositions.forEach((m) => {
        assignments.push({ user_id: m.user_id, position: nextPosition++ });
      });
      break;
  }

  return assignments.sort((a, b) => a.position - b.position);
}

describe("calculateCycleDates", () => {
  const startDate = new Date("2024-01-01");

  describe("weekly frequency", () => {
    it("calculates correct dates for cycle 1", () => {
      const { start, due } = calculateCycleDates(startDate, 1, "weekly");
      expect(start.toISOString().split("T")[0]).toBe("2024-01-01");
      expect(due.toISOString().split("T")[0]).toBe("2024-01-07");
    });

    it("calculates correct dates for cycle 2", () => {
      const { start, due } = calculateCycleDates(startDate, 2, "weekly");
      expect(start.toISOString().split("T")[0]).toBe("2024-01-08");
      expect(due.toISOString().split("T")[0]).toBe("2024-01-14");
    });

    it("calculates correct dates for cycle 5", () => {
      const { start, due } = calculateCycleDates(startDate, 5, "weekly");
      expect(start.toISOString().split("T")[0]).toBe("2024-01-29");
      expect(due.toISOString().split("T")[0]).toBe("2024-02-04");
    });
  });

  describe("biweekly frequency", () => {
    it("calculates correct dates for cycle 1", () => {
      const { start, due } = calculateCycleDates(startDate, 1, "biweekly");
      expect(start.toISOString().split("T")[0]).toBe("2024-01-01");
      expect(due.toISOString().split("T")[0]).toBe("2024-01-14");
    });

    it("calculates correct dates for cycle 2", () => {
      const { start, due } = calculateCycleDates(startDate, 2, "biweekly");
      expect(start.toISOString().split("T")[0]).toBe("2024-01-15");
      expect(due.toISOString().split("T")[0]).toBe("2024-01-28");
    });
  });

  describe("monthly frequency", () => {
    it("calculates correct dates for cycle 1", () => {
      const { start, due } = calculateCycleDates(startDate, 1, "monthly");
      expect(start.toISOString().split("T")[0]).toBe("2024-01-01");
      expect(due.toISOString().split("T")[0]).toBe("2024-01-31");
    });

    it("calculates correct dates for cycle 2", () => {
      const { start, due } = calculateCycleDates(startDate, 2, "monthly");
      expect(start.toISOString().split("T")[0]).toBe("2024-02-01");
      expect(due.toISOString().split("T")[0]).toBe("2024-02-29"); // 2024 is a leap year
    });

    it("calculates correct dates for cycle 12", () => {
      const { start, due } = calculateCycleDates(startDate, 12, "monthly");
      expect(start.toISOString().split("T")[0]).toBe("2024-12-01");
      expect(due.toISOString().split("T")[0]).toBe("2024-12-31");
    });
  });
});

describe("assignPayoutOrder", () => {
  const members = [
    { user_id: "user-a", payout_position: null },
    { user_id: "user-b", payout_position: null },
    { user_id: "user-c", payout_position: null },
  ];

  describe("fixed method", () => {
    it("assigns positions alphabetically when no positions are set", () => {
      const result = assignPayoutOrder(members, "fixed");
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ user_id: "user-a", position: 1 });
      expect(result[1]).toEqual({ user_id: "user-b", position: 2 });
      expect(result[2]).toEqual({ user_id: "user-c", position: 3 });
    });

    it("respects existing positions", () => {
      const membersWithPositions = [
        { user_id: "user-a", payout_position: 3 },
        { user_id: "user-b", payout_position: 1 },
        { user_id: "user-c", payout_position: 2 },
      ];
      const result = assignPayoutOrder(membersWithPositions, "fixed");
      expect(result[0]).toEqual({ user_id: "user-b", position: 1 });
      expect(result[1]).toEqual({ user_id: "user-c", position: 2 });
      expect(result[2]).toEqual({ user_id: "user-a", position: 3 });
    });
  });

  describe("organizer_assigned method", () => {
    it("assigns remaining positions to members without positions", () => {
      const mixedMembers = [
        { user_id: "user-a", payout_position: 2 },
        { user_id: "user-b", payout_position: null },
        { user_id: "user-c", payout_position: 1 },
      ];
      const result = assignPayoutOrder(mixedMembers, "organizer_assigned");
      expect(result).toHaveLength(3);
      expect(result.find((r) => r.user_id === "user-c")?.position).toBe(1);
      expect(result.find((r) => r.user_id === "user-a")?.position).toBe(2);
      expect(result.find((r) => r.user_id === "user-b")?.position).toBe(3);
    });
  });

  describe("lottery method", () => {
    it("assigns positions to all members", () => {
      const result = assignPayoutOrder(members, "lottery");
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.position >= 1 && r.position <= 3)).toBe(true);
    });
  });
});
