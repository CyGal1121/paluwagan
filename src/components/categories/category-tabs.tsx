"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "./category-icon";
import type { Category } from "@/types/database";

interface CategoryTabsProps {
  categories: Array<Category & { branch_count: number }>;
  selectedSlug?: string;
}

export function CategoryTabs({ categories, selectedSlug }: CategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    router.push(`/home?${params.toString()}`);
  };

  const totalBranches = categories.reduce((sum, cat) => sum + cat.branch_count, 0);

  return (
    <Tabs value={selectedSlug || "all"} onValueChange={handleTabChange}>
      <TabsList className="flex flex-wrap h-auto gap-1.5 p-1.5 bg-muted/40 rounded-xl border border-border/50">
        <TabsTrigger
          value="all"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted"
        >
          All
          <span className="text-xs opacity-70">({totalBranches})</span>
        </TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.slug}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted"
          >
            <CategoryIcon icon={category.icon} className="h-4 w-4" />
            {category.name}
            {category.branch_count > 0 && (
              <span className="text-xs opacity-70">({category.branch_count})</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
