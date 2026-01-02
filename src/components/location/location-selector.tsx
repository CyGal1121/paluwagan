"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Loader2 } from "lucide-react";
import { getRegions, getProvinces, getCities, getBarangays } from "@/lib/actions/location";
import type { Region, Province, City, Barangay } from "@/types/database";

interface LocationSelectorProps {
  initialRegionId?: string;
  initialProvinceId?: string;
  initialCityId?: string;
  initialBarangayId?: string;
  initialIsDiscoverable?: boolean;
  onLocationChange?: (location: {
    regionId: string | null;
    provinceId: string | null;
    cityId: string | null;
    barangayId: string | null;
    isDiscoverable: boolean;
  }) => void;
  showDiscoverableToggle?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export function LocationSelector({
  initialRegionId,
  initialProvinceId,
  initialCityId,
  initialBarangayId,
  initialIsDiscoverable = false,
  onLocationChange,
  showDiscoverableToggle = true,
  required = false,
  disabled = false,
}: LocationSelectorProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(initialRegionId || null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(initialProvinceId || null);
  const [selectedCity, setSelectedCity] = useState<string | null>(initialCityId || null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(initialBarangayId || null);
  const [isDiscoverable, setIsDiscoverable] = useState(initialIsDiscoverable);

  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Load regions on mount
  useEffect(() => {
    async function loadRegions() {
      setLoadingRegions(true);
      const data = await getRegions();
      setRegions(data);
      setLoadingRegions(false);
    }
    loadRegions();
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    if (selectedRegion) {
      setLoadingProvinces(true);
      getProvinces(selectedRegion).then((data) => {
        setProvinces(data);
        setLoadingProvinces(false);
      });
    } else {
      setProvinces([]);
    }
  }, [selectedRegion]);

  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      setLoadingCities(true);
      getCities(selectedProvince).then((data) => {
        setCities(data);
        setLoadingCities(false);
      });
    } else {
      setCities([]);
    }
  }, [selectedProvince]);

  // Load barangays when city changes
  useEffect(() => {
    if (selectedCity) {
      setLoadingBarangays(true);
      getBarangays(selectedCity).then((data) => {
        setBarangays(data);
        setLoadingBarangays(false);
      });
    } else {
      setBarangays([]);
    }
  }, [selectedCity]);

  // Notify parent of changes
  const notifyChange = useCallback(() => {
    onLocationChange?.({
      regionId: selectedRegion,
      provinceId: selectedProvince,
      cityId: selectedCity,
      barangayId: selectedBarangay,
      isDiscoverable,
    });
  }, [selectedRegion, selectedProvince, selectedCity, selectedBarangay, isDiscoverable, onLocationChange]);

  useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedProvince(null);
    setSelectedCity(null);
    setSelectedBarangay(null);
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedCity(null);
    setSelectedBarangay(null);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedBarangay(null);
  };

  const handleBarangayChange = (value: string) => {
    setSelectedBarangay(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <MapPin className="h-4 w-4" />
        <span>Branch Location</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">
            Region {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedRegion || ""}
            onValueChange={handleRegionChange}
            disabled={disabled || loadingRegions}
          >
            <SelectTrigger id="region">
              {loadingRegions ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select region" />
              )}
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Province/City (NCR) */}
        <div className="space-y-2">
          <Label htmlFor="province">
            Province/City {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedProvince || ""}
            onValueChange={handleProvinceChange}
            disabled={disabled || !selectedRegion || loadingProvinces}
          >
            <SelectTrigger id="province">
              {loadingProvinces ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder={selectedRegion ? "Select province/city" : "Select region first"} />
              )}
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City/Municipality */}
        <div className="space-y-2">
          <Label htmlFor="city">
            City/Municipality {required && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedCity || ""}
            onValueChange={handleCityChange}
            disabled={disabled || !selectedProvince || loadingCities}
          >
            <SelectTrigger id="city">
              {loadingCities ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder={selectedProvince ? "Select city/municipality" : "Select province first"} />
              )}
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Barangay */}
        <div className="space-y-2">
          <Label htmlFor="barangay">Barangay (Optional)</Label>
          <Select
            value={selectedBarangay || ""}
            onValueChange={handleBarangayChange}
            disabled={disabled || !selectedCity || loadingBarangays}
          >
            <SelectTrigger id="barangay">
              {loadingBarangays ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder={selectedCity ? "Select barangay" : "Select city first"} />
              )}
            </SelectTrigger>
            <SelectContent>
              {barangays.map((barangay) => (
                <SelectItem key={barangay.id} value={barangay.id}>
                  {barangay.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Discoverable Toggle */}
      {showDiscoverableToggle && (
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="discoverable"
            checked={isDiscoverable}
            onCheckedChange={(checked) => setIsDiscoverable(checked === true)}
            disabled={disabled || !selectedCity}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="discoverable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Make branch discoverable
            </label>
            <p className="text-xs text-muted-foreground">
              Allow other members to find and join your branch through the Discover page.
              {!selectedCity && " (Select a city first)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
