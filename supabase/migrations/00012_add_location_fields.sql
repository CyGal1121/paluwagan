-- Philippine location hierarchy
-- Regions > Provinces > Cities/Municipalities > Barangays

-- Regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Provinces table
CREATE TABLE IF NOT EXISTS public.provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cities/Municipalities table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city_class TEXT CHECK (city_class IN ('city', 'municipality')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Barangays table
CREATE TABLE IF NOT EXISTS public.barangays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add location fields to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id),
ADD COLUMN IF NOT EXISTS barangay_id UUID REFERENCES public.barangays(id),
ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT false;

-- Create indexes for location lookups
CREATE INDEX IF NOT EXISTS idx_provinces_region ON public.provinces(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_province ON public.cities(province_id);
CREATE INDEX IF NOT EXISTS idx_barangays_city ON public.barangays(city_id);
CREATE INDEX IF NOT EXISTS idx_groups_city ON public.groups(city_id);
CREATE INDEX IF NOT EXISTS idx_groups_barangay ON public.groups(barangay_id);
CREATE INDEX IF NOT EXISTS idx_groups_discoverable ON public.groups(is_discoverable) WHERE is_discoverable = true;

-- RLS Policies for location tables (read-only for all authenticated users)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;

-- Everyone can read location data
CREATE POLICY "Anyone can read regions" ON public.regions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read provinces" ON public.provinces
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read barangays" ON public.barangays
  FOR SELECT USING (true);

-- Seed data: Major Philippine regions
INSERT INTO public.regions (code, name) VALUES
  ('NCR', 'National Capital Region'),
  ('CAR', 'Cordillera Administrative Region'),
  ('I', 'Ilocos Region'),
  ('II', 'Cagayan Valley'),
  ('III', 'Central Luzon'),
  ('IV-A', 'CALABARZON'),
  ('IV-B', 'MIMAROPA'),
  ('V', 'Bicol Region'),
  ('VI', 'Western Visayas'),
  ('VII', 'Central Visayas'),
  ('VIII', 'Eastern Visayas'),
  ('IX', 'Zamboanga Peninsula'),
  ('X', 'Northern Mindanao'),
  ('XI', 'Davao Region'),
  ('XII', 'SOCCSKSARGEN'),
  ('XIII', 'Caraga'),
  ('BARMM', 'Bangsamoro Autonomous Region in Muslim Mindanao')
ON CONFLICT (code) DO NOTHING;

-- Seed data: Sample provinces (NCR cities are treated as provinces for simplicity)
INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-MNL', 'Manila' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-QC', 'Quezon City' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-MKT', 'Makati' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-PSG', 'Pasig' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-TGG', 'Taguig' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-PSY', 'Pasay' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-MND', 'Mandaluyong' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-SJN', 'San Juan' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-MRT', 'Marikina' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-PNT', 'Parañaque' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-LPC', 'Las Piñas' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-MUN', 'Muntinlupa' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-VZL', 'Valenzuela' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-MLB', 'Malabon' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-NVT', 'Navotas' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'NCR-CLK', 'Caloocan' FROM public.regions r WHERE r.code = 'NCR'
ON CONFLICT (code) DO NOTHING;

-- Other major provinces
INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'III-BUL', 'Bulacan' FROM public.regions r WHERE r.code = 'III'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'III-PMG', 'Pampanga' FROM public.regions r WHERE r.code = 'III'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'IV-A-CVT', 'Cavite' FROM public.regions r WHERE r.code = 'IV-A'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'IV-A-LGN', 'Laguna' FROM public.regions r WHERE r.code = 'IV-A'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'IV-A-BTG', 'Batangas' FROM public.regions r WHERE r.code = 'IV-A'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'IV-A-RZL', 'Rizal' FROM public.regions r WHERE r.code = 'IV-A'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'VII-CEB', 'Cebu' FROM public.regions r WHERE r.code = 'VII'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.provinces (region_id, code, name)
SELECT r.id, 'XI-DVS', 'Davao del Sur' FROM public.regions r WHERE r.code = 'XI'
ON CONFLICT (code) DO NOTHING;

-- Sample cities for key areas
INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-MNL-C', 'City of Manila', 'city' FROM public.provinces p WHERE p.code = 'NCR-MNL'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-QC-C', 'Quezon City', 'city' FROM public.provinces p WHERE p.code = 'NCR-QC'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-MKT-C', 'Makati City', 'city' FROM public.provinces p WHERE p.code = 'NCR-MKT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-TGG-C', 'Taguig City', 'city' FROM public.provinces p WHERE p.code = 'NCR-TGG'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-PSG-C', 'Pasig City', 'city' FROM public.provinces p WHERE p.code = 'NCR-PSG'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-MND-C', 'Mandaluyong City', 'city' FROM public.provinces p WHERE p.code = 'NCR-MND'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cities (province_id, code, name, city_class)
SELECT p.id, 'NCR-MUN-C', 'Muntinlupa City', 'city' FROM public.provinces p WHERE p.code = 'NCR-MUN'
ON CONFLICT (code) DO NOTHING;

-- Sample barangays for Makati
INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-MKT-BEL', 'Bel-Air' FROM public.cities c WHERE c.code = 'NCR-MKT-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-MKT-LEG', 'Legaspi Village' FROM public.cities c WHERE c.code = 'NCR-MKT-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-MKT-SAL', 'Salcedo Village' FROM public.cities c WHERE c.code = 'NCR-MKT-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-MKT-PBL', 'Poblacion' FROM public.cities c WHERE c.code = 'NCR-MKT-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-MKT-SAN', 'San Antonio' FROM public.cities c WHERE c.code = 'NCR-MKT-C'
ON CONFLICT (code) DO NOTHING;

-- Sample barangays for Quezon City
INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-QC-DLM', 'Diliman' FROM public.cities c WHERE c.code = 'NCR-QC-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-QC-CBN', 'Cubao' FROM public.cities c WHERE c.code = 'NCR-QC-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-QC-KMN', 'Kamuning' FROM public.cities c WHERE c.code = 'NCR-QC-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-QC-SMP', 'South Triangle' FROM public.cities c WHERE c.code = 'NCR-QC-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-QC-TCT', 'Tatalon' FROM public.cities c WHERE c.code = 'NCR-QC-C'
ON CONFLICT (code) DO NOTHING;

-- Sample barangays for Taguig (BGC area)
INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-TGG-BGC', 'Bonifacio Global City' FROM public.cities c WHERE c.code = 'NCR-TGG-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-TGG-SIG', 'Signal Village' FROM public.cities c WHERE c.code = 'NCR-TGG-C'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.barangays (city_id, code, name)
SELECT c.id, 'NCR-TGG-UPT', 'Upper Bicutan' FROM public.cities c WHERE c.code = 'NCR-TGG-C'
ON CONFLICT (code) DO NOTHING;
