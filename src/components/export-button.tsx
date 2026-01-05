"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Users, Loader2 } from "lucide-react";
import { generateCSV, generateMemberReport } from "@/lib/actions/export";
import { toast } from "sonner";

interface ExportButtonProps {
  groupId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButton({
  groupId,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportLedger = async () => {
    setIsExporting("ledger");
    try {
      const result = await generateCSV(groupId);
      if (result.success && result.csv && result.filename) {
        downloadCSV(result.csv, result.filename);
        toast.success("Ledger exported successfully");
      } else {
        toast.error(result.error || "Failed to export ledger");
      }
    } catch {
      toast.error("Failed to export ledger");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportMembers = async () => {
    setIsExporting("members");
    try {
      const result = await generateMemberReport(groupId);
      if (result.success && result.csv && result.filename) {
        downloadCSV(result.csv, result.filename);
        toast.success("Member report exported successfully");
      } else {
        toast.error(result.error || "Failed to export member report");
      }
    } catch {
      toast.error("Failed to export member report");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={!!isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportLedger} disabled={!!isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Ledger (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMembers} disabled={!!isExporting}>
          <Users className="h-4 w-4 mr-2" />
          Export Members (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
