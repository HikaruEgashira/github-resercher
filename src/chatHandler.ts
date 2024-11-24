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
      const [selectedModel] = await vscode.lm.selectChatModels(MODEL_SELECTOR);
      if (selectedModel) {
        // Create system message with tool descriptions
        const toolDescriptions = tools
          .map(
            (tool) =>
              `${tool.name}: ${tool.description} (${JSON.stringify(zodToJsonSchema(tool.schema), null, 2).replaceAll("\n", " ")})`,
          )
          .join("\n");
        const systemMessage = `You have access to the following tools:\n${toolDescriptions}\n\nTo use a tool, respond with a message that includes the tool name and input in a JSON format like this: {"tool": "tool_name", "input": {"param1": "value1", "param2": "value2"}}`;

        // Get response from the model
        const modelResponse = await selectedModel.sendRequest(
          [
            { name: "system", role: vscode.LanguageModelChatMessageRole.Assistant, content: systemMessage },
            { name: "user", role: vscode.LanguageModelChatMessageRole.User, content: request.prompt },
          ],
          {},
          token,
        );

        try {
          // Try to parse the response as a tool invocation
          let responseText = "";
          for await (const chunk of modelResponse.text) {
            responseText += chunk;
          }
          const parsedResponse = JSON.parse(responseText);
          if (
            parsedResponse &&
            typeof parsedResponse === "object" &&
            "tool" in parsedResponse &&
            "input" in parsedResponse
          ) {
            const selectedTool = tools.find((t) => t.name === parsedResponse.tool);
            if (selectedTool) {
              try {
                // Validate input against the specific tool's schema
                const validatedInput = selectedTool.schema.parse(parsedResponse.input);
                // Execute tool action with validated input
                stream.progress(
                  `Executing tool '${parsedResponse.tool}' with input: ${JSON.stringify(validatedInput, null, 2)}`,
                );
                const result = await selectedTool.action(validatedInput, context);

                stream.progress(`Result from tool: ${result}`);
                const { messages } = await renderPrompt(
                  Prompt,
                  { userQuery: request.prompt, result },
                  { modelMaxPromptTokens: selectedModel.maxInputTokens },
                  selectedModel,
                );

                const chatResponse = await selectedModel.sendRequest(messages, {}, token);
                for await (const fragment of chatResponse.text) {
                  stream.markdown(fragment);
                }
              } catch (validationError) {
                // Enhanced error message for validation errors
                if (validationError instanceof Error) {
                  const errorDetails = JSON.stringify(validationError, null, 2);
                  stream.markdown(`Invalid input for tool '${parsedResponse.tool}': ${errorDetails}`);
                } else {
                  stream.markdown(
                    `Invalid input for tool '${parsedResponse.tool}': ${JSON.stringify(validationError, null, 2)}`,
                  );
                }
              }
            } else {
              stream.markdown(
                `Tool '${parsedResponse.tool}' not found. Available tools: ${tools.map((t) => t.name).join(", ")}`,
              );
            }
          } else {
            // If not a tool invocation, stream the response directly
            for await (const chunk of modelResponse.text) {
              stream.markdown(chunk);
            }
          }
        } catch {
          // If not JSON or invalid format, stream the response directly
          for await (const chunk of modelResponse.text) {
            stream.markdown(chunk);
          }
        }
      }
    } catch (err) {
      handleChatError(err, stream);
    }

    return { metadata: { command: "" } };
  };

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
