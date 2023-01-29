import { ParseError } from './error';
import { Token, TokenType, AST } from './types';

class Parser {
  private done = false;
  private _undo: AST[] = [];

  constructor(private stream: Generator<Token>) {}

  hasNext() {
    return !this.done;
  }

  undoParseExpression(ast: AST) {
    this._undo.push(ast);
  }

  getUndo() {
    return this._undo.pop();
  }

  parseExpression(previous: Token | null): AST | null {
    const undoed = this.getUndo();
    if (undoed) return undoed;

    const iterator: IteratorResult<Token> = this.stream.next();
    this.done = iterator.done ?? true;

    if (iterator.done) return null;

    const token = iterator.value;

    switch (token.type) {
      case TokenType.MULTIPLY:
      case TokenType.PLUS:
      case TokenType.MINUS: {
        const nextOp = this.parseExpression(token);
        if (!nextOp) throw new ParseError(`Expected expression after ${token}`);
        return [token.type, nextOp];
      }

      case TokenType.ASSIGN:
        return [token.type, this.parseExpression(token)];

      case TokenType.SEPARATOR:
        return [token.type, this.parseExpression(token)];

      case TokenType.NUMBER: {
        const nextOp = this.parseExpression(token);
        const possibleNumberOperators: TokenType[] = [TokenType.MULTIPLY, TokenType.PLUS, TokenType.MINUS, TokenType.EQUALITY, TokenType.INEQUALITY];
        if (nextOp && (possibleNumberOperators.includes(nextOp?.[0] as TokenType))) {
          return [token.type, token.literal, nextOp];
        } else if (nextOp) {
          this.undoParseExpression(nextOp);
        }

        return [token.type, token.literal];
      }

      case TokenType.LINE_TERMINATOR:
        return null;

      case TokenType.SYMBOL: {
        const nextOp = this.parseExpression(token);
        if (nextOp?.[0] === TokenType.RPAREN) {
          this.undoParseExpression(nextOp);
        } else if (nextOp) {
          return [token.type, token.literal, nextOp];
        }
        return [token.type, token.literal];
      }

      case TokenType.EQUALITY:
      case TokenType.INEQUALITY: {
        return [token.type, this.parseExpression(token)];
      }

      case TokenType.ILLEGAL: {
        throw new ParseError(`Illegal token '${token.literal}'`);
      }

      case TokenType.LPAREN: {
        const body = this.parseExpression(token);
        const terminateParen = this.parseExpression(token);
        // if (!terminateParen || terminateParen[0] !== TokenType.RPAREN) throw new ParseError(`Expected '${TokenType.RPAREN}' after '${TokenType.LPAREN}'. Found ${terminateParen?.[1]}`);

        return [token.type, body, terminateParen];
      }

      case TokenType.RPAREN: {
        if (!previous) throw new ParseError(`Expected '${TokenType.LPAREN}' before '${token.literal}'`);

        const nextOp = this.parseExpression(token);
        if (nextOp && nextOp[0] !== TokenType.SEPARATOR) {
          throw new ParseError(`Expected '${TokenType.SEPARATOR}' after '${TokenType.RPAREN}'. Found ${nextOp && nextOp[1]}`);
        } else if (nextOp) {
          return [token.type, nextOp];
        }

        return [token.type];
      }

      default:
        throw new ParseError(`Unexpected token '${token.type}'`);
    }
  }
}

export function* parse(stream: Generator<Token>) {
  const parser = new Parser(stream);

  while (parser.hasNext()) {
    const ast = parser.parseExpression(null);
    if (ast) yield ast;
  }
}
