"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, text: "text-base" },
  md: { icon: 40, text: "text-lg" },
  lg: { icon: 48, text: "text-xl" },
  xl: { icon: 64, text: "text-2xl" },
};

export function Logo({ size = "md", variant = "full", className }: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* PP Logo Icon */}
      <Image
        src="/logo.png"
        alt="Pinoy Paluwagan"
        width={sizes.icon}
        height={sizes.icon}
        className="flex-shrink-0"
        priority
      />

      {/* Text */}
      {variant === "full" && (
        <span className={cn(sizes.text, "font-display font-semibold text-foreground")}>
          Pinoy Paluwagan
        </span>
      )}
    </div>
  );
}

// Alternative logo with stacked text
export function LogoStacked({
  size = "md",
  variant = "full",
  className,
}: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* PP Logo Icon */}
      <Image
        src="/logo.png"
        alt="Pinoy Paluwagan"
        width={sizes.icon}
        height={sizes.icon}
        className="flex-shrink-0"
        priority
      />

      {/* Text */}
      {variant === "full" && (
        <div className="flex flex-col">
          <span
            className={cn(
              sizes.text,
              "font-display font-semibold text-foreground leading-tight"
            )}
          >
            Pinoy
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Paluwagan
          </span>
        </div>
      )}
    </div>
  );
}

// Minimal PP mark for favicons or small spaces
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Pinoy Paluwagan"
      width={32}
      height={32}
      className={cn("flex-shrink-0", className)}
      priority
    />
  );
}
