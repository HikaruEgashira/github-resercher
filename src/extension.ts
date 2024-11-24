import * as vscode from "vscode";
import { chatHandler } from "./chatHandler";

const githubTokenKey = "githubToken";

export async function activate(context: vscode.ExtensionContext) {
  const app = vscode.chat.createChatParticipant("vscode-copilot.searchable", chatHandler(context));
  app.iconPath = vscode.Uri.joinPath(context.extensionUri, "atom.png");

  const command = "searchable.reset";
  async function commandHandler() {
    await context.secrets.delete(githubTokenKey);
    await getGithubToken(context);
  }
  context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}

export async function getGithubToken(context: vscode.ExtensionContext): Promise<string> {
  const githubToken = await context.secrets.get(githubTokenKey);
  if (githubToken) {
    return githubToken;
  }

  const value = await vscode.window.showInputBox({ prompt: "Enter your GitHub Token" });
  if (value) {
    context.secrets.store(githubTokenKey, value);
    return value;
  }

  return await getGithubToken(context);
}

export function deactivate(context: vscode.ExtensionContext) {
  context.secrets.delete(githubTokenKey);
}
