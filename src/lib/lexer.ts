import { CARRIAGE_RETURN, WHITE_SPACE, BREAK_LINE, SEMI_COLON, COLON, RPAREN } from '../constants';
import { LexError } from './error';
import { peekableStream, PeekableStreamResponse } from './peekable-stream';
import { char, Position, Token, TokenType } from './types';
import { parseNumber } from './number';

class Lexer {
  stream: PeekableStreamResponse<string>;
  row = 0;
  col = 0;

  constructor(input: string) {
    this.stream = peekableStream<string>(input);
  }

  scan(until: char | char[]): char[] {
    if (!Array.isArray(until)) until = [until];

    let char: char;
    const chars = [];

    while ((char = this.peekNextChar())) {
      if (until.includes(char)) break;
      chars.push(char);
    }

    return chars;
  }

  hasNext(): boolean {
    return Boolean(this.peekLastChar());
  }

  getPosition(): Position {
    return new Position(this.row, this.col);
  }

  lexNext(): Token | null {
    let char: char;
    switch ((char = this.nextChar())) {
      case BREAK_LINE:
        this.row++;
      // eslint-disable-next-line no-fallthrough
      case WHITE_SPACE:
      case CARRIAGE_RETURN:
        return null;
      case TokenType.ASSIGN: {
        const nextChars = this.scan([WHITE_SPACE]);
        if (nextChars.length === 1 && nextChars[0] === TokenType.ASSIGN) {
          const chars = [char, ...nextChars];
          return new Token(TokenType.EQUALITY, chars.join(''), this.getPosition());
        }
        return new Token(TokenType.ASSIGN, char, this.getPosition());
      }

      case TokenType.EXCLAMATION: {
        const nextChars = this.scan([WHITE_SPACE]);
        if (nextChars.length === 0 || nextChars[0] !== TokenType.ASSIGN) throw new LexError(`Expected '${TokenType.ASSIGN}' after '${char}'`);
        const chars = [char, ...nextChars];
        return new Token(TokenType.INEQUALITY, chars.join(''), this.getPosition());
      }

      case TokenType.LINE_TERMINATOR:
        return new Token(TokenType.LINE_TERMINATOR, ';', this.getPosition());
      case TokenType.LPAREN:
        return new Token(TokenType.LPAREN, '(', this.getPosition());
      case TokenType.RPAREN:
        return new Token(TokenType.RPAREN, ')', this.getPosition());
      case TokenType.COMMA:
        return new Token(TokenType.COMMA, ',', this.getPosition());
      case TokenType.PLUS:
        return new Token(TokenType.PLUS, '+', this.getPosition());
      case TokenType.MINUS:
        return new Token(TokenType.MINUS, '-', this.getPosition());
      case TokenType.LBRACE:
        return new Token(TokenType.LBRACE, '{', this.getPosition());
      case TokenType.RBRACE:
        return new Token(TokenType.RBRACE, '}', this.getPosition());
      case TokenType.EOF:
        return new Token(TokenType.EOF, '', this.getPosition());

      case COLON:
        return new Token(TokenType.SEPARATOR, COLON, this.getPosition());

      case 'a':
      case 'b':
      case 'c':
      case 'd':
      case 'e':
      case 'f':
      case 'g':
      case 'h':
      case 'i':
      case 'j':
      case 'k':
      case 'l':
      case 'm':
      case 'n':
      case 'ñ':
      case 'o':
      case 'p':
      case 'q':
      case 'r':
      case 's':
      case 't':
      case 'u':
      case 'v':
      case 'w':
      case 'x':
      case 'y':
      case 'z': {
        const chars = [char, ...this.scan([COLON, WHITE_SPACE, SEMI_COLON, RPAREN])];
        return new Token(TokenType.SYMBOL, chars.join(''), this.getPosition());
      }

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9': {
        const chars = [char, ...this.scan([WHITE_SPACE, SEMI_COLON, RPAREN])];
        const number = chars.join('');
        if (parseNumber(number) === null) throw new LexError(`Number '${number}' is not a valid number`);
        return new Token(TokenType.NUMBER, number, this.getPosition());
      }
      default:
        return new Token(TokenType.ILLEGAL, char, this.getPosition());
    }
  }

  peekNextChar() {
    return this.stream.peekNext().value;
  }

  peekLastChar() {
    return this.stream.peek().value;
  }

  nextChar() {
    this.col++;
    return this.stream.next().value;
  }
}

export function* lex(code: string): Generator<Token> {
  const lexer = new Lexer(code);

  while (lexer.hasNext()) {
    try {
      const lexed = lexer.lexNext();
      if (lexed !== null) yield lexed;
    } catch (error) {
      if (error instanceof Error) throw new LexError(`${lexer.getPosition()} ${error.message}`);
    }
  }
}
