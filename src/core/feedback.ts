import type { ValidationFeedbackMessage } from "./types";

/**
 * Converts normalized feedback codes into user-facing strings.
 */
export const formatFeedbackMessage = (message: ValidationFeedbackMessage): string => {
  if (message.code === "tag.mismatch") {
    return `Token ${message.tokenId ?? "?"}: expected ${message.params?.expected} but got ${message.params?.received}`;
  }

  if (message.code === "structure.mismatch") {
    return `Incorrect ${message.params?.part} selection`;
  }

  if (message.code === "gn_link.mismatch") {
    return `Link ${message.tokenId ?? "?"} is incorrect`;
  }

  if (message.code === "agreement.mismatch") {
    return `Agreement mismatch for ${message.tokenId ?? "?"}`;
  }

  return message.code;
};
