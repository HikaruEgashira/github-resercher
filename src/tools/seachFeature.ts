import type * as vscode from "vscode";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import type { Tool } from ".";
import { getGithubToken } from "../extension";

const schema = z.object({
  org: z.string().describe("The organization to search for GitHub repositories.").optional(),
  feature: z.string().describe("The feature to search for. (regex)"),
  query: z.string().describe("The search query to find definition in GitHub. (regex)"),
});

const action = async (input: z.infer<typeof schema>, context: vscode.ExtensionContext) => {
  const githubToken = await getGithubToken(context);
  const octokit = new Octokit({ auth: githubToken });

  let query = `NOT is:fork path:/${input.feature}/ /${input.query}/`;
  if (input.org) {
    query += ` org:${input.org}`;
  }

  const searchResults = await octokit.search.code({
    q: query,
    per_page: 3,
    order: "desc",
  });
  const summaries: string[] = [];

  for (const item of searchResults.data.items) {
    const summary = [
      `Repository: ${item.repository.full_name}`,
      `URL: ${item.html_url}`,
      `Code: ${item.text_matches?.map((match) => match.fragment).join("\n")}`,
    ].join("\n");
    summaries.push(summary);
  }

  if (summaries.length === 0) {
    return "No matching GitHub repositories were found.";
  }
  return summaries.join("\n\n");
};

export const tool: Tool<typeof schema> = {
  name: "searchFeature",
  description: "Search for features in GitHub repositories.",
  schema,
  action,
};
