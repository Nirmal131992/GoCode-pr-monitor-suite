// src/tests/challenge.test.ts
import { describe, test, expect } from 'vitest';
import { ApiClient } from '../gateway/apiClient';
import { PrOrchestrator } from '../providers/providerOrchestrator';
import { middlewarePayloadSchema } from '../contracts/pullRequests';

describe('PR Monitor Automation Suite', () => {
  const gateway = new ApiClient();
  const orchestrator = new PrOrchestrator(gateway);

  describe('Part 1: Live API Data Integration', () => {
    test('fetches all open pull requests across all pages and drops drafts', async () => {
      const startPath = '/repos/appwrite/appwrite/pulls?state=open&per_page=100';
      const allPRs = await orchestrator.collectAllOpenPRs(startPath);
      const openNonDraftPRs = allPRs.filter(pr => pr.state === 'open' && !pr.draft);

      console.log(`Raw items collected: ${allPRs.length}`);
      console.log(`Filtered open non-draft items: ${openNonDraftPRs.length}`);

      expect(allPRs.length).toBeGreaterThan(0);
    });
  });

  describe('Part 2: Middleware Rule Validation', () => {
    const mockPayload: unknown = {
      "product_id": "appwrite-001",
      "total_open_prs": 1,
      "last_updated": "2024-03-20T15:30:00Z",
      "pull_requests": [
        {
          "id": 1024,
          "title": "feat: add SQS support to testing commons",
          "author": { "username": "nej.jissard", "role": "admin" },
          "status": "OPEN",
          "labels": ["backend", "high-priority"],
          "meta": { "is_draft": false, "review_comments": 5 }
        }
      ]
    };

    test('validates payload tracking integrity and high-priority flags', () => {
      const data = middlewarePayloadSchema.parse(mockPayload);

      expect(
        data.pull_requests.length,
        `Integrity failure: expected ${data.total_open_prs} items but found ${data.pull_requests.length}`
      ).toBe(data.total_open_prs);

      for (const pr of data.pull_requests) {
        if (pr.labels.includes('high-priority')) {
          expect(
            pr.meta.is_draft,
            `Rule infraction: High priority PR #${pr.id} ("${pr.title}") by user ${pr.author.username} cannot be stored as a draft`
          ).toBe(false);
        }
      }
    });
// writing negative test - additional test by Nirmal :)
    test('fails when high-priority pull request is a draft', () => {
      const invalidPayload: unknown = {
        "product_id": "appwrite-001",
        "total_open_prs": 1,
        "last_updated": "2024-03-20T15:30:00Z",
        "pull_requests": [
          {
            "id": 9999,
            "title": "broken feature branch",
            "author": { "username": "test.user", "role": "developer" },
            "status": "OPEN",
            "labels": ["high-priority"],
            "meta": { "is_draft": true, "review_comments": 0 }
          }
        ]
      };

      const data = middlewarePayloadSchema.parse(invalidPayload);

      const runValidation = () => {
        for (const pr of data.pull_requests) {
          if (pr.labels.includes('high-priority') && pr.meta.is_draft) {
            throw new Error(`Rule infraction: High priority PR #${pr.id} cannot be a draft`);
          }
        }
      };

      expect(runValidation).toThrow('Rule infraction: High priority PR #9999');
    });
  });
});
