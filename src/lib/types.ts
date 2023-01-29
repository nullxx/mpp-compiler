export type char = string;

export enum TokenType {
  ILLEGAL = 'ILLEGAL',
  EOF = 'EOF',
  INT = 'INT',
  ASSIGN = '=',
  EQUALITY = '==',
  INEQUALITY = '!=',
  PLUS = '+',
  MINUS = '-',
  MULTIPLY = '*',
  COMMA = ',',
  LINE_TERMINATOR = ';',
  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',
  SEPARATOR = ':',
  EXCLAMATION = '!',
  SYMBOL = 'SYMBOL',
  NUMBER = 'NUMBER',
}

export class Position {
  constructor(public row: number, public col: number) {}

  toString() {
    return `${this.row+1}:${this.col+1}`;
  }
}

export class Token {
  constructor(public type: TokenType, public literal: string, public position: Position) {}

  toString() {
    return `'${this.literal}' (${this.type}) (${this.position})`;
  }
}

export type AST<T = TokenType> = Array<T | AST<T> | string | null>;
