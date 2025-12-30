"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroup } from "@/lib/actions/group";
import { createGroupSchema, type CreateGroupInput } from "@/lib/validations/group";
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
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Name and contribution" },
  { id: 2, title: "Schedule", description: "Frequency and start date" },
  { id: 3, title: "Settings", description: "Members and payout order" },
  { id: 4, title: "Review", description: "Confirm and create" },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      contribution_amount: 1000,
      frequency: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      members_limit: 10,
      payout_order_method: "organizer_assigned",
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
      toast.success("Group created successfully!");
      router.push(`/groups/${result.data.id}`);
    } else {
      toast.error(result.error || "Failed to create group");
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateGroupInput)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["name", "contribution_amount"];
        break;
      case 2:
        fieldsToValidate = ["frequency", "start_date"];
        break;
      case 3:
        fieldsToValidate = ["members_limit", "payout_order_method"];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => Math.min(s + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const values = form.watch();

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Group</h1>
          <p className="text-muted-foreground text-sm">Set up your paluwagan group</p>
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
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name your group and set the contribution amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
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
              </CardContent>
            </Card>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
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

          {/* Step 3: Settings */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
                <CardDescription>Configure members and payout order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="members_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Members</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Total members including yourself (2-50)
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
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>Confirm your group settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Group Name</span>
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
                    <span className="font-medium">{values.members_limit} people</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Pool per Cycle</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(values.contribution_amount * values.members_limit)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Payout Order</span>
                    <span className="font-medium capitalize">
                      {values.payout_order_method.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {values.members_limit} cycles (
                      {values.frequency === "weekly"
                        ? `${values.members_limit} weeks`
                        : values.frequency === "biweekly"
                          ? `${values.members_limit * 2} weeks`
                          : `${values.members_limit} months`}
                      )
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
                Create Group
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
