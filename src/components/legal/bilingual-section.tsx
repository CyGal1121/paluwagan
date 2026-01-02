"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface BilingualSectionProps {
  titleEn: string;
  titleFil: string;
  contentEn: React.ReactNode;
  contentFil: React.ReactNode;
  className?: string;
}

export function BilingualSection({
  titleEn,
  titleFil,
  contentEn,
  contentFil,
  className,
}: BilingualSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {/* Desktop: Side by side */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-8">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{titleEn}</h2>
          <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none">
            {contentEn}
          </div>
        </div>
        <div className="space-y-3 border-l pl-8">
          <h2 className="text-lg font-semibold text-primary">{titleFil}</h2>
          <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none">
            {contentFil}
          </div>
        </div>
      </div>

      {/* Mobile: Stacked */}
      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{titleEn}</h2>
          <div className="text-muted-foreground leading-relaxed text-sm">
            {contentEn}
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <h2 className="text-lg font-semibold text-primary">{titleFil}</h2>
          <div className="text-muted-foreground leading-relaxed text-sm">
            {contentFil}
          </div>
        </div>
      </div>
    </section>
  );
}

interface LanguageToggleProps {
  language: "en" | "fil" | "both";
  onLanguageChange: (lang: "en" | "fil" | "both") => void;
}

export function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => onLanguageChange("en")}
        className="text-xs"
      >
        English
      </Button>
      <Button
        variant={language === "fil" ? "default" : "ghost"}
        size="sm"
        onClick={() => onLanguageChange("fil")}
        className="text-xs"
      >
        Filipino
      </Button>
      <Button
        variant={language === "both" ? "default" : "ghost"}
        size="sm"
        onClick={() => onLanguageChange("both")}
        className="text-xs gap-1"
      >
        <Globe className="h-3 w-3" />
        Both
      </Button>
    </div>
  );
}

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalPageLayout({ children, title, lastUpdated }: LegalPageLayoutProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </header>
        <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
