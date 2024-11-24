import type * as vscode from "vscode";
import type * as z from "zod";
import * as serch from "./search";
import * as seachFeature from "./seachFeature";
import * as searchDef from "./searchDef";

export interface BaseTool {
  name: string;
  description: string;
  schema: z.ZodType;
  action: (input: z.infer<z.ZodType>, context: vscode.ExtensionContext) => Promise<string>;
}

export interface Tool<T extends z.ZodType> extends BaseTool {
  name: string;
  description: string;
  schema: T;
  action: (input: z.infer<T>, context: vscode.ExtensionContext) => Promise<string>;
}

export const tools: BaseTool[] = [serch.tool, seachFeature.tool, searchDef.tool];
