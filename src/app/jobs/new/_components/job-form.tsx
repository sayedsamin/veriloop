"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createJobAction, updateJobAction } from "@/modules/jobs/job.actions";
import { CreateJobSchema } from "@/types/job.schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

type CreateJobFormValues = z.input<typeof CreateJobSchema>;
type JobFormProps = {
  mode?: "create" | "edit";
  jobId?: number;
  initialValues?: CreateJobFormValues;
};

const defaultRequirement: CreateJobFormValues["requirements"][number] = {
  category: "skill",
  name: "",
  weight: 5,
  isMandatory: false,
  aiContext: "",
};

export function JobForm({ mode = "create", jobId, initialValues }: JobFormProps) {
  const router = useRouter();
  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(CreateJobSchema),
    defaultValues: initialValues ?? {
      title: "",
      description: "",
      location: "",
      employmentType: "full_time",
      salaryMin: 90000,
      salaryMax: 120000,
      salaryCurrency: "USD",
      requirements: [defaultRequirement],
      aiSettings: {
        autoRejectThreshold: 50,
        feedbackMode: "semi",
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requirements",
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
      setOpenContextById({});
    }
  }, [form, initialValues]);

  const [openContextById, setOpenContextById] = useState<Record<string, boolean>>(
    {}
  );

  async function onSubmit(values: CreateJobFormValues) {
    const parsed = CreateJobSchema.parse(values);
    const result =
      mode === "edit" && jobId
        ? await updateJobAction(jobId, parsed)
        : await createJobAction(parsed);

    if (result.success) {
      if (mode === "edit") {
        toast.success("Job updated successfully.");
        router.push(`/dashboard/hr/jobs/${jobId}`);
        router.refresh();
      } else {
        toast.success("Job created successfully.");
        form.reset({
          title: "",
          description: "",
          location: "",
          employmentType: "full_time",
          salaryMin: 90000,
          salaryMax: 120000,
          salaryCurrency: "USD",
          requirements: [defaultRequirement],
          aiSettings: {
            autoRejectThreshold: 50,
            feedbackMode: "semi",
          },
        });
        setOpenContextById({});
      }
      return;
    }

    toast.error(result.error ?? (mode === "edit" ? "Failed to update job." : "Failed to create job."));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Senior Frontend Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role and responsibilities."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Toronto, ON / Remote (North America)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="salaryMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Min</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number.parseInt(event.target.value || "0", 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Max</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number.parseInt(event.target.value || "0", 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input
                    maxLength={3}
                    placeholder="USD"
                    {...field}
                    value={field.value ?? "USD"}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Requirements</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ ...defaultRequirement })}
            >
              Add Requirement
            </Button>
          </div>

          {fields.map((fieldItem, index) => {
            const aiContextValue = form.watch(`requirements.${index}.aiContext`) ?? "";
            const isOpen = openContextById[fieldItem.id] || aiContextValue.trim().length > 0;

            return (
              <div key={fieldItem.id} className="space-y-3 rounded-lg border p-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <FormField
                    control={form.control}
                    name={`requirements.${index}.category`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="skill">Skill</SelectItem>
                            <SelectItem value="experience">Experience</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="certification">Certification</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`requirements.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-4">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="React" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`requirements.${index}.weight`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>Weight: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0] ?? 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`requirements.${index}.isMandatory`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Mandatory</FormLabel>
                        <FormControl>
                          <div className="flex h-9 items-center">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(Boolean(checked))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-1">
                    <p className="invisible text-sm">Delete</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) =>
                    setOpenContextById((current) => ({
                      ...current,
                      [fieldItem.id]: open,
                    }))
                  }
                >
                  <Button
                    type="button"
                    variant={isOpen ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() =>
                      setOpenContextById((current) => ({
                        ...current,
                        [fieldItem.id]: !isOpen,
                      }))
                    }
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Add AI Context
                  </Button>
                  <CollapsibleContent className="mt-3">
                    <FormField
                      control={form.control}
                      name={`requirements.${index}.aiContext`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Prioritize experience with Next.js App Router over Pages Router."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Hidden instructions for AI scoring on this requirement.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="aiSettings.autoRejectThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auto Reject Threshold: {field.value}%</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0] ?? 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aiSettings.feedbackMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Mode</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedback mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="semi">Semi</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save Changes"
              : "Create Job"}
        </Button>
      </form>
    </Form>
  );
}
