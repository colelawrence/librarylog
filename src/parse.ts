import { ParsedText } from "../types/parse";

export const parseText = (text: string): ParsedText => {
  return {
    header: {},
    contents: [{
      message: text,
    }],
  };
};
