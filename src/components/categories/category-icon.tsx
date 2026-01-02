"use client";

import {
  Banknote,
  Utensils,
  Gem,
  Tv,
  Smartphone,
  Package,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  banknote: Banknote,
  utensils: Utensils,
  gem: Gem,
  tv: Tv,
  smartphone: Smartphone,
  package: Package,
};

interface CategoryIconProps {
  icon: string | null;
  className?: string;
}

export function CategoryIcon({ icon, className = "h-5 w-5" }: CategoryIconProps) {
  const Icon = icon ? iconMap[icon] || Package : Package;
  return <Icon className={className} />;
}
