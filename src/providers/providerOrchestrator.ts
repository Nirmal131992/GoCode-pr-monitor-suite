import { ApiClient } from '../gateway/apiClient';
import { githubPullListSchema, PullRequest } from '../contracts/pullRequests';

export class PrOrchestrator {
  constructor(private apiGateway: ApiClient) {}

  async collectAllOpenPRs(initialPath: string): Promise<PullRequest[]> {
    const totalRecords: PullRequest[] = [];
    let nextUrl: string | null = initialPath;

    while (nextUrl) {
      // Explicitly typing the response variable completely satisfies strict compilers
      const res: { body: unknown; nextPageUrl: string | null } = await this.apiGateway.fetchRecords(nextUrl);
      const verifiedChunk = githubPullListSchema.parse(res.body);
      
      totalRecords.push(...verifiedChunk);
      nextUrl = res.nextPageUrl;
    }

    return totalRecords;
  }
}
