// src/contracts/pullRequests.ts
import { z } from 'zod';

export const githubPullSchema = z.object({
  id: z.number(),
  number: z.number(),
  state: z.string(),
  title: z.string(),
  draft: z.boolean(),
  html_url: z.string().url(),
}).passthrough();

export const githubPullListSchema = z.array(githubPullSchema);
export type PullRequest = z.infer<typeof githubPullSchema>;

export const middlewarePRSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.object({
    username: z.string(),
    role: z.string(),
  }),
  status: z.enum(['OPEN', 'CLOSED', 'MERGED']),
  labels: z.array(z.string()),
  meta: z.object({
    is_draft: z.boolean(),
    review_comments: z.number(),
  }),
});

export const middlewarePayloadSchema = z.object({
  product_id: z.string(),
  total_open_prs: z.number(),
  last_updated: z.string(), // (date) handle custom JSON variations
  pull_requests: z.array(middlewarePRSchema),
});
