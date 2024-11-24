import type * as vscode from "vscode";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import type { Tool } from ".";
import { getGithubToken } from "../extension";

const schema = z.object({
  query: z.string().describe("The search query to find code. (regex)"),
});

const action = async (input: z.infer<typeof schema>, context: vscode.ExtensionContext) => {
  const githubToken = await getGithubToken(context);
  const octokit = new Octokit({ auth: githubToken });

  const searchResults = await octokit.search.code({
    q: `NOT is:fork /${input.query}/`,
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
    return "No matching code were found.";
  }
  return summaries.join("\n\n");
};

export const tool: Tool<typeof schema> = {
  name: "searchByKeyword",
  description: "Search for code in GitHub repositories.",
  schema,
  action,
};
