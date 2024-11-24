import {
    type BasePromptElementProps,
    PromptElement,
    type PromptSizing,
    UserMessage,
    AssistantMessage,
} from "@vscode/prompt-tsx";

export interface PromptProps extends BasePromptElementProps {
    userQuery: string;
    result: string;
}

export class Prompt extends PromptElement<PromptProps, void> {
    render(_state: undefined, _sizing: PromptSizing) {
        return (
            <>
                <AssistantMessage>
                    You can answer only about the results found on github.
                    result found on github: {this.props.result}.
                </AssistantMessage>
                <UserMessage>{this.props.userQuery}</UserMessage>
            </>
        );
    }
}
