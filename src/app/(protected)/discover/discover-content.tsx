"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Calendar,
  Loader2,
  Compass,
  Filter,
  X,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getRegions,
  getProvinces,
  getCities,
  searchDiscoverableBranches,
  type SearchBranchesParams,
  type SearchBranchesResult,
} from "@/lib/actions/location";
import { getCategories } from "@/lib/actions/category";
import type { Region, Province, City, Category, DiscoverableBranch } from "@/types/database";
import { CategoryIcon } from "@/components/categories/category-icon";
import Link from "next/link";

export function DiscoverContent() {
  // Location data
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Selected filters
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Results
  const [results, setResults] = useState<SearchBranchesResult>({
    branches: [],
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      const [regionsData, categoriesData] = await Promise.all([
        getRegions(),
        getCategories(),
      ]);
      setRegions(regionsData);
      setCategories(categoriesData);
    }
    loadInitialData();
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    if (selectedRegion) {
      getProvinces(selectedRegion).then(setProvinces);
      setSelectedProvince("");
      setSelectedCity("");
    } else {
      setProvinces([]);
    }
  }, [selectedRegion]);

  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      getCities(selectedProvince).then(setCities);
      setSelectedCity("");
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

  // Search function
  const performSearch = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    const params: SearchBranchesParams = {
      regionId: selectedRegion || undefined,
      cityId: selectedCity || undefined,
      categoryId: selectedCategory || undefined,
      search: searchQuery || undefined,
      limit: 20,
      offset: loadMore ? results.branches.length : 0,
    };

    const searchResults = await searchDiscoverableBranches(params);

    if (loadMore) {
      setResults((prev) => ({
        ...searchResults,
        branches: [...prev.branches, ...searchResults.branches],
      }));
    } else {
      setResults(searchResults);
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  }, [selectedRegion, selectedCity, selectedCategory, searchQuery, results.branches.length]);

  // Initial search
  useEffect(() => {
    performSearch();
  }, [selectedRegion, selectedCity, selectedCategory]);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearFilters = () => {
    setSelectedRegion("");
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedCategory("");
    setSearchQuery("");
  };

  const hasFilters = selectedRegion || selectedCity || selectedCategory || searchQuery;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Region */}
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="All regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Province */}
              <div className="space-y-2">
                <Label>Province/City</Label>
                <Select
                  value={selectedProvince}
                  onValueChange={setSelectedProvince}
                  disabled={!selectedRegion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedRegion ? "All provinces" : "Select region first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All provinces</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label>City/Municipality</Label>
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProvince ? "All cities" : "Select province first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Searching..."
          ) : (
            <>
              Found <span className="font-medium text-foreground">{results.total}</span> discoverable{" "}
              {results.total === 1 ? "branch" : "branches"}
            </>
          )}
        </p>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : results.branches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Compass className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No branches found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {hasFilters
                ? "Try adjusting your filters or search query to find more branches."
                : "There are no discoverable branches yet. Check back later or create your own!"}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}

      {/* Load More */}
      {results.hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => performSearch(true)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function BranchCard({ branch }: { branch: DiscoverableBranch }) {
  const memberCount = branch.group_members?.[0]?.count || 0;
  const slotsRemaining = branch.members_limit - memberCount;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base truncate">{branch.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {branch.barangays?.name && `${branch.barangays.name}, `}
                {branch.cities?.name || "Location not set"}
              </span>
            </CardDescription>
          </div>
          {branch.categories && (
            <Badge variant="secondary" className="flex-shrink-0 gap-1">
              <CategoryIcon icon={branch.categories.icon} className="h-3 w-3" />
              {branch.categories.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{formatCurrency(branch.contribution_amount)}</p>
              <p className="text-xs text-muted-foreground capitalize">{branch.frequency}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{memberCount}/{branch.members_limit}</p>
              <p className="text-xs text-muted-foreground">
                {slotsRemaining > 0 ? `${slotsRemaining} slots left` : "Full"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{formatDate(branch.start_date)}</p>
              <p className="text-xs text-muted-foreground">Start date</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium capitalize">{branch.status}</p>
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
          </div>
        </div>

        {/* Organizer */}
        {branch.users?.name && (
          <p className="text-xs text-muted-foreground">
            Organized by <span className="font-medium">{branch.users.name}</span>
          </p>
        )}

        {/* Action */}
        <Button asChild className="w-full" disabled={slotsRemaining <= 0}>
          <Link href={`/groups/${branch.id}`}>
            {slotsRemaining > 0 ? "View Branch" : "Branch Full"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
