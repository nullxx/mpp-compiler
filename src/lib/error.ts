export class ParseError extends Error {
  constructor(message: string) {
    super(`Parse Error: ${message}`);
  }
}

export class LexError extends Error {
  constructor(message: string) {
    super(`Lex Error: ${message}`);
  }
}

export class GenerateError extends Error {
  constructor(message: string) {
    super(`Generate Error: ${message}`);
  }
}

export class AllocationError extends Error {
  constructor(message: string) {
    super(`Allocation Error: ${message}`);
  }
}

export class InstructionFormatError extends Error {
  constructor(message: string) {
    super(`Instruction Format Error: ${message}`);
  }
}
