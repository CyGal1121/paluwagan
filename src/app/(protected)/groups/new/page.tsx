"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroup } from "@/lib/actions/group";
import { getCategories } from "@/lib/actions/category";
import { createGroupSchema, type CreateGroupInput } from "@/lib/validations/group";
import { BRANCH_SLOTS, BRANCH_FEES, ORGANIZER_FEE, type Category, calculateNetPayout } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Check, Users, Info, UserPlus, Percent } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CategorySelector } from "@/components/categories";
import { CategoryIcon } from "@/components/categories/category-icon";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = [
  { id: 1, title: "Category", description: "Choose category" },
  { id: 2, title: "Basic Info", description: "Name and contribution" },
  { id: 3, title: "Schedule", description: "Frequency and start date" },
  { id: 4, title: "Review", description: "Confirm and create" },
];

export default function CreateBranchPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories();
      setCategories(cats);
      setLoadingCategories(false);
    }
    loadCategories();
  }, []);

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      contribution_amount: 1000,
      frequency: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      members_limit: BRANCH_SLOTS,
      payout_order_method: "organizer_assigned",
      category_id: undefined,
      organizer_joins: false,
      organizer_fee_type: "percentage",
      organizer_fee_value: ORGANIZER_FEE.DEFAULT_PERCENTAGE,
      rules_json: {
        grace_period_days: 3,
        late_fee_percent: 0,
        auto_approve_members: false,
      },
    },
  });

  const onSubmit = async (data: CreateGroupInput) => {
    setIsLoading(true);
    const result = await createGroup(data);
    setIsLoading(false);

    if (result.success && result.data) {
      toast.success("Branch created successfully!");
      router.push(`/groups/${result.data.id}`);
    } else {
      toast.error(result.error || "Failed to create branch");
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateGroupInput)[] = [];

    switch (step) {
      case 1:
        // Category is optional, just proceed
        break;
      case 2:
        fieldsToValidate = ["name", "contribution_amount"];
        break;
      case 3:
        fieldsToValidate = ["frequency", "start_date"];
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (!isValid) return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const values = form.watch();
  const selectedCategory = categories.find((c) => c.id === values.category_id);

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Branch</h1>
          <p className="text-muted-foreground text-sm">Set up your paluwagan branch</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`flex-1 text-center ${s.id !== STEPS.length ? "border-b-2" : ""} ${
              s.id <= step ? "border-primary" : "border-muted"
            } pb-2`}
          >
            <div
              className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-medium ${
                s.id < step
                  ? "bg-primary text-primary-foreground"
                  : s.id === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s.id < step ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <p className="text-xs mt-1 hidden sm:block">{s.title}</p>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Category */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Category</CardTitle>
                <CardDescription>What type of paluwagan is this?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        {loadingCategories ? (
                          <div className="h-10 bg-muted rounded animate-pulse" />
                        ) : (
                          <CategorySelector
                            categories={categories}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select a category"
                          />
                        )}
                      </FormControl>
                      <FormDescription>
                        Choose the type of contribution (Cash, Food, Gold, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fixed 10 slots info */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Fixed {BRANCH_SLOTS} Slots</p>
                      <p className="text-sm text-muted-foreground">
                        Each branch has exactly {BRANCH_SLOTS} member slots available.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Organizer joins as member option */}
                <FormField
                  control={form.control}
                  name="organizer_joins"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <UserPlus className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="font-medium cursor-pointer">
                              Join as a Member
                            </FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormDescription>
                            As the organizer, you can choose to occupy the first slot and participate in
                            the rotation. If unchecked, you will only manage the branch without receiving payouts.
                          </FormDescription>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Fee info */}
                <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Branch Fees</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Setup fee: {formatCurrency(BRANCH_FEES.SETUP)} (one-time) <br />
                        Monthly fee: {formatCurrency(BRANCH_FEES.MONTHLY)}/month
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name your branch and set the contribution amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Office Paluwagan 2024" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a name that your members will recognize
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contribution_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribution Amount (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          max={1000000}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount each member contributes per cycle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payout_order_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Order Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="organizer_assigned">
                            Organizer Assigned
                          </SelectItem>
                          <SelectItem value="fixed">Fixed Order (by join date)</SelectItem>
                          <SelectItem value="lottery">Lottery (random)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>How payout order is determined</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Organizer Fee */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Percent className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Organizer Fee</p>
                      <p className="text-sm text-muted-foreground">
                        Your fee deducted from each payout ({ORGANIZER_FEE.MIN_PERCENTAGE}%-{ORGANIZER_FEE.MAX_PERCENTAGE}%)
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="organizer_fee_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Percentage (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={ORGANIZER_FEE.MIN_PERCENTAGE}
                            max={ORGANIZER_FEE.MAX_PERCENTAGE}
                            step={0.5}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview of net payout */}
                  {values.contribution_amount > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="text-muted-foreground mb-1">Preview (with {BRANCH_SLOTS} members):</p>
                      <div className="flex justify-between">
                        <span>Gross Pool:</span>
                        <span>{formatCurrency(values.contribution_amount * BRANCH_SLOTS)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Your Fee ({values.organizer_fee_value}%):</span>
                        <span>-{formatCurrency((values.contribution_amount * BRANCH_SLOTS) * (values.organizer_fee_value / 100))}</span>
                      </div>
                      <div className="flex justify-between font-medium text-primary border-t mt-1 pt-1">
                        <span>Member Receives:</span>
                        <span>
                          {formatCurrency(
                            calculateNetPayout(
                              values.contribution_amount,
                              BRANCH_SLOTS,
                              "percentage",
                              values.organizer_fee_value
                            ).netPayout
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Set the frequency and start date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Biweekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>How often members contribute</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>When the first cycle begins</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>Confirm your branch settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  {selectedCategory && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium flex items-center gap-1.5">
                        <CategoryIcon icon={selectedCategory.icon} className="h-4 w-4" />
                        {selectedCategory.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Branch Name</span>
                    <span className="font-medium">{values.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Contribution</span>
                    <span className="font-medium">
                      {formatCurrency(values.contribution_amount)} / {values.frequency}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">
                      {new Date(values.start_date).toLocaleDateString("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">{BRANCH_SLOTS} slots (fixed)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Organizer Participation</span>
                    <span className="font-medium">
                      {values.organizer_joins ? (
                        <span className="text-primary">Joining as member (Slot 1)</span>
                      ) : (
                        <span className="text-muted-foreground">Managing only</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Organizer Fee</span>
                    <span className="font-medium">{values.organizer_fee_value}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Pool per Cycle</span>
                    <span className="font-medium">
                      {formatCurrency(values.contribution_amount * BRANCH_SLOTS)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Net Payout (after fee)</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(
                        calculateNetPayout(
                          values.contribution_amount,
                          BRANCH_SLOTS,
                          "percentage",
                          values.organizer_fee_value
                        ).netPayout
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Payout Order</span>
                    <span className="font-medium capitalize">
                      {values.payout_order_method.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {BRANCH_SLOTS} cycles (
                      {values.frequency === "weekly"
                        ? `${BRANCH_SLOTS} weeks`
                        : values.frequency === "biweekly"
                          ? `${BRANCH_SLOTS * 2} weeks`
                          : `${BRANCH_SLOTS} months`}
                      )
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-medium">
                      {formatCurrency(BRANCH_FEES.SETUP)} setup + {formatCurrency(BRANCH_FEES.MONTHLY)}/mo
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < 4 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Branch
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
