export type ParsedText = {
  header: { [key: string]: string | object },
  contents: Message[],
};

export type Message = {
  type?: number,
  name?: string,
  message?: string,
};
