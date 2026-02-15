import { z } from "zod";

export const JobRequirementSchema = z.object({
  category: z.enum(["skill", "experience", "education", "certification"]),
  name: z.string().min(2),
  weight: z.number().min(1).max(10),
  isMandatory: z.boolean().default(false),
  aiContext: z
    .string()
    .optional()
    .describe(
      "Hidden instructions for the AI on how to score this specific requirement."
    ),
});

export const CreateJobSchema = z.object({
  title: z.string().min(5),
  description: z.string().optional(),
  location: z.string().trim().min(2).max(120),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  salaryMin: z.number().int().min(0),
  salaryMax: z.number().int().min(0),
  salaryCurrency: z.string().trim().toUpperCase().length(3).default("USD"),
  requirements: z.array(JobRequirementSchema).min(1),
  aiSettings: z.object({
    autoRejectThreshold: z.number().min(0).max(100),
    feedbackMode: z.enum(["auto", "manual", "semi"]),
  }),
}).refine((value) => value.salaryMax >= value.salaryMin, {
  message: "Salary max must be greater than or equal to salary min.",
  path: ["salaryMax"],
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
