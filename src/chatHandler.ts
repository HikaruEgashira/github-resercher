import * as vscode from "vscode";
import { tools } from "./tools";
import { Prompt } from "./prompt";
import { zodToJsonSchema } from "zod-to-json-schema";
import { renderPrompt } from "@vscode/prompt-tsx";

export interface IChatResult extends vscode.ChatResult {
  metadata: {
    command: string;
  };
}

const MODEL_SELECTOR: vscode.LanguageModelChatSelector = {
  vendor: "copilot",
  family: "gpt-4o-mini",
};

export const chatHandler =
  (context: vscode.ExtensionContext): vscode.ChatRequestHandler =>
  async (request, _context, stream, token) => {
    try {
      const selectedModel = await selectModel();
      if (selectedModel) {
        const systemMessage = createSystemMessage();
        const modelResponse = await getModelResponse(selectedModel, systemMessage, request.prompt, token);
        const parsedResponse = await parseModelResponse(modelResponse);

        if (isValidToolInvocation(parsedResponse)) {
          const selectedTool = tools.find((tool) => tool.name === parsedResponse.tool);
          if (selectedTool) {
            try {
              const validatedInput = selectedTool.schema.parse(parsedResponse.input);
              const result = await selectedTool.action(validatedInput, context);

              stream.progress(`Result from tool: ${result}`);
              const { messages } = await renderPrompt(
                Prompt,
                { userQuery: request.prompt, result },
                { modelMaxPromptTokens: selectedModel.maxInputTokens },
                selectedModel,
              );

              stream.progress(`Sending messages to model: ${JSON.stringify(messages)}`);
              const chatResponse = await selectedModel.sendRequest(messages, {}, token);
              for await (const fragment of chatResponse.text) {
                stream.markdown(fragment);
              }
            } catch (validationError) {
              stream.markdown(`Error: ${validationError.message}`);
            }
          }
        }
      }
    } catch (error) {
      handleChatError(error, stream);
    }
  };

async function selectModel() {
  const [selectedModel] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
  return selectedModel;
}

function createSystemMessage() {
  const toolDescriptions = tools
    .map(
      (tool) =>
        `${tool.name}: ${tool.description} (${JSON.stringify(zodToJsonSchema(tool.schema), null, 2).replaceAll("\n", " ")})`,
    )
    .join("\n");
  return `You have access to the following tools:\n${toolDescriptions}\n\nTo use a tool, respond with a message that includes the tool name and input in a JSON format like this: {"tool": "tool_name", "input": {"param1": "value1", "param2": "value2"}}`;
}

async function getModelResponse(
  selectedModel: vscode.LanguageModelChat,
  systemMessage: string,
  userPrompt: string,
  token: vscode.CancellationToken,
) {
  return await selectedModel.sendRequest(
    [
      { name: "system", role: vscode.LanguageModelChatMessageRole.Assistant, content: systemMessage },
      { name: "user", role: vscode.LanguageModelChatMessageRole.User, content: userPrompt },
    ],
    {},
    token,
  );
}

async function parseModelResponse(modelResponse: { text: AsyncIterable<string> }) {
  let responseText = "";
  for await (const chunk of modelResponse.text) {
    responseText += chunk;
  }
  return JSON.parse(responseText);
}

interface ParsedResponse {
  tool: string;
  input: unknown;
}

function isValidToolInvocation(parsedResponse: ParsedResponse) {
  return parsedResponse && typeof parsedResponse === "object" && "tool" in parsedResponse && "input" in parsedResponse;
}

function handleChatError(err: unknown, stream: vscode.ChatResponseStream): void {
  if (err instanceof vscode.LanguageModelError) {
    console.error(err.message, err.code, err.cause);
    if (err.cause instanceof Error && err.cause.message.includes("off_topic")) {
      stream.markdown("off_topic");
    } else {
      stream.markdown(`VSCode Chat Model Error: ${err.message}`);
    }
  } else {
    stream.markdown(`${err}`);
  }
}
