import { describe, expect, test } from "bun:test";
import {
  chatHistoryMacro,
  formatSceneMapChatHistory,
  parseChatHistoryLimit,
  renderSceneMapPromptTemplate,
  type SceneMapPromptTemplateValues,
} from "./prompt-templates";

const values: SceneMapPromptTemplateValues = {
  schema: "SCHEMA",
  responseSchema: "RESPONSE SCHEMA",
  previousTracker: "PREVIOUS",
  exampleResponse: "EXAMPLE",
  exampleSection: "EXAMPLE SECTION",
  character: "CHARACTER",
  persona: "PERSONA",
  scenario: "SCENARIO",
  worldInfo: "WORLD INFO",
  context: "CONTEXT",
  mode: "full",
  selectedFields: "",
  feedback: "",
  partialTask: "",
  chatHistory: [" first ", "second\r\nline", "third"],
};

describe("SceneMap prompt templates", () => {
  test("expands namespaced and legacy macros without consuming Lumiverse macros", () => {
    expect(renderSceneMapPromptTemplate(
      "{{scenemap_schema}} | {{previous_tracker}} | {{char}}",
      values,
    )).toBe("SCHEMA | PREVIOUS | {{char}}");
  });

  test("formats all chat messages chronologically with only a blank line between them", () => {
    expect(renderSceneMapPromptTemplate("{{scenemap_chat_history}}", values))
      .toBe("first\n\nsecond\nline\n\nthird");
  });

  test("limits chat history from the end while preserving chronological order", () => {
    expect(renderSceneMapPromptTemplate("{{scenemap_chat_history:: 2 }}", values))
      .toBe("second\nline\n\nthird");
  });

  test("expands partial-regeneration feedback", () => {
    expect(renderSceneMapPromptTemplate("Feedback: {{scenemap_feedback}}", {
      ...values,
      mode: "partial",
      feedback: "The position contradicts the final message.",
    })).toBe("Feedback: The position contradicts the final message.");
  });

  test("rejects invalid chat history limits", () => {
    expect(() => parseChatHistoryLimit("0")).toThrow("at least 1");
    expect(() => parseChatHistoryLimit("recent")).toThrow("positive whole number");
  });

  test("normalizes legacy history settings into macro syntax", () => {
    expect(chatHistoryMacro(20)).toBe("{{scenemap_chat_history::20}}");
    expect(chatHistoryMacro(0)).toBe("{{scenemap_chat_history}}");
  });

  test("does not add separators around an empty history", () => {
    expect(formatSceneMapChatHistory(["", "  "], null)).toBe("");
  });
});
