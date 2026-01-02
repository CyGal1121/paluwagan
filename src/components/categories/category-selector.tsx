"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "./category-icon";
import type { Category } from "@/types/database";

interface CategorySelectorProps {
  categories: Category[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategorySelector({
  categories,
  value,
  onValueChange,
  placeholder = "Select a category",
  disabled = false,
}: CategorySelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && categories.find((c) => c.id === value) && (
            <div className="flex items-center gap-2">
              <CategoryIcon
                icon={categories.find((c) => c.id === value)?.icon || null}
                className="h-4 w-4"
              />
              {categories.find((c) => c.id === value)?.name}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <CategoryIcon icon={category.icon} className="h-4 w-4" />
              {category.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
