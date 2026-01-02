"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  Smartphone,
  Tv,
  Refrigerator,
  WashingMachine,
  Microwave,
  Laptop,
  Headphones,
  Watch,
  Clock,
  CheckCircle2,
  Truck,
  CreditCard,
  Sparkles,
  Bell,
} from "lucide-react";

// Sample product categories
const categories = [
  { id: "all", name: "All", icon: Sparkles },
  { id: "phones", name: "Phones", icon: Smartphone },
  { id: "laptops", name: "Laptops", icon: Laptop },
  { id: "tv", name: "TVs", icon: Tv },
  { id: "refrigerator", name: "Refrigerators", icon: Refrigerator },
  { id: "washing", name: "Washing Machines", icon: WashingMachine },
  { id: "kitchen", name: "Kitchen", icon: Microwave },
  { id: "audio", name: "Audio", icon: Headphones },
  { id: "wearables", name: "Wearables", icon: Watch },
];

// Sample products (placeholder data)
const sampleProducts = [
  {
    id: 1,
    name: "Samsung Galaxy A54",
    category: "phones",
    price: 22990,
    monthlyPrice: 1916,
    months: 12,
    image: "📱",
    badge: "Popular",
  },
  {
    id: 2,
    name: "iPhone 15",
    category: "phones",
    price: 54990,
    monthlyPrice: 4583,
    months: 12,
    image: "📱",
    badge: "New",
  },
  {
    id: 3,
    name: 'Samsung 43" Smart TV',
    category: "tv",
    price: 18990,
    monthlyPrice: 1583,
    months: 12,
    image: "📺",
  },
  {
    id: 4,
    name: "HP Laptop 15",
    category: "laptops",
    price: 32990,
    monthlyPrice: 2749,
    months: 12,
    image: "💻",
    badge: "Best Seller",
  },
  {
    id: 5,
    name: "Condura Refrigerator",
    category: "refrigerator",
    price: 15990,
    monthlyPrice: 1333,
    months: 12,
    image: "🧊",
  },
  {
    id: 6,
    name: "LG Front Load Washer",
    category: "washing",
    price: 24990,
    monthlyPrice: 2083,
    months: 12,
    image: "🧺",
  },
  {
    id: 7,
    name: "Air Fryer Oven",
    category: "kitchen",
    price: 4990,
    monthlyPrice: 832,
    months: 6,
    image: "🍳",
  },
  {
    id: 8,
    name: "JBL Wireless Speaker",
    category: "audio",
    price: 8990,
    monthlyPrice: 749,
    months: 12,
    image: "🔊",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PautangPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = sampleProducts.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20">
              <Link href="/home">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Pautang Appliances & Gadgets</h1>
              <p className="text-white/80 text-sm">Get now, pay monthly</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Coming Soon Banner */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">Coming Soon!</p>
              <p className="text-sm text-amber-700">
                This service is under development. Sign up to be notified when we launch!
              </p>
            </div>
            <Button size="sm" variant="outline" className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100">
              <Bell className="h-4 w-4 mr-1" />
              Notify Me
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">1. Choose & Apply</p>
                  <p className="text-xs text-muted-foreground">
                    Browse products and submit your application
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">2. We Deliver</p>
                  <p className="text-xs text-muted-foreground">
                    Get your item delivered to your doorstep
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">3. Pay Monthly</p>
                  <p className="text-xs text-muted-foreground">
                    Affordable monthly payments, no credit card needed
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 gap-1.5 ${
                  isSelected
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-5xl relative">
                {product.image}
                {product.badge && (
                  <Badge className="absolute top-2 right-2 bg-violet-600">
                    {product.badge}
                  </Badge>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-violet-600 transition-colors">
                  {product.name}
                </h3>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-violet-600 font-bold">
                    {formatCurrency(product.monthlyPrice)}
                    <span className="text-xs font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    for {product.months} months
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or category filter
              </p>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Who can apply?</h4>
              <p className="text-sm text-muted-foreground">
                Any verified Paluwagan member can apply for Pautang. You must complete
                ID verification first.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">What are the requirements?</h4>
              <p className="text-sm text-muted-foreground">
                Valid ID, proof of income, and a small down payment (varies per product).
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">How long is the approval process?</h4>
              <p className="text-sm text-muted-foreground">
                Most applications are processed within 24-48 hours.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">What if I miss a payment?</h4>
              <p className="text-sm text-muted-foreground">
                We offer flexible payment arrangements. Contact us immediately if you
                anticipate any payment difficulties.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
