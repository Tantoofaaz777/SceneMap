export type GenerationButtonCommand = "generate_tracker" | "cancel_generation";

/**
 * A second click is always cancellation, including the short interval before
 * the backend's active-generation acknowledgement reaches the frontend.
 */
export function getGenerationButtonCommand(
  generationActive: boolean,
  requestPending: boolean,
): GenerationButtonCommand {
  return generationActive || requestPending ? "cancel_generation" : "generate_tracker";
}
