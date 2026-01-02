"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Cycle {
  id: string;
  cycle_number: number;
  status: string;
}

interface CycleSelectorProps {
  cycles: Cycle[];
  selectedCycleNumber: number;
  groupId: string;
}

export function CycleSelector({ cycles, selectedCycleNumber, groupId }: CycleSelectorProps) {
  const router = useRouter();

  return (
    <Select
      defaultValue={selectedCycleNumber.toString()}
      onValueChange={(value) => {
        router.push(`/groups/${groupId}/ledger?cycle=${value}`);
      }}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {cycles.map((c) => (
          <SelectItem key={c.id} value={c.cycle_number.toString()}>
            Cycle {c.cycle_number}
            {c.status === "open" && " (Current)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
