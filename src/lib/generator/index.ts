import { GenerateError } from '../error';
import { AST, TokenType } from '../types';
import { Instruction } from '../instruction';
import { generateAsignation } from './_asignation';
import { Environment } from './_environment';
import { generateLabel, preGenerateLabel } from './_label';
import { generateJump } from './command/_jump';
import { isCommand, JMP_COMMAND_SYMBOL, SHOW_COMMAND_SYMBOL } from './command/_comands';
import { isCondition, generateCondition } from './_condition';
import { createGeneratorFromArray, generatorToArray } from '../utils/function';
import { generateShow } from './command/_show';

class _Generator {
  static depth = 0;
  static MAX_NESTED_DEPTH_ALLOWED = 20;
  done = false;

  constructor(private stream: Generator<AST>, public environment: Environment) {
    _Generator.depth++;
  }

  hasNext() {
    if (this.done) _Generator.depth--;
    return !this.done;
  }

  preGenerate() {
    const arr: AST[] = generatorToArray(this.stream) as AST<TokenType>[]; // consume
    for (const ast of arr) {
      if (ast[2]?.[0] === TokenType.SEPARATOR) preGenerateLabel(ast, { environment: this.environment });
    }

    this.stream = createGeneratorFromArray<AST>(arr); // reload consumed
  }

  generate(): Instruction[] | null {
    const iterator: IteratorResult<AST> = this.stream.next();
    this.done = iterator.done ?? true;

    if (iterator.done) return null;

    const ast = iterator.value;

    if (ast[0] !== TokenType.SYMBOL) throw new GenerateError(`Expected symbol. Found ${ast[0]}`);

    if (ast.length < 3) throw new GenerateError(`Expected expression. Found ${ast[0]}`);
    if (!ast[2] || ast[2].length === 0) {
      throw new GenerateError(`Expected operation expression`);
    }

    if (isCondition(ast)) {
      const gCondition = generateCondition(ast, { environment: this.environment });
      return gCondition;
    }

    switch (ast[2][0]) {
      case TokenType.ASSIGN: {
        const gAsignation = generateAsignation(ast, { environment: this.environment });
        return gAsignation;
        break;
      }

      case TokenType.SEPARATOR: {
        const gLabel = generateLabel(ast, { environment: this.environment });
        return gLabel;
        break;
      }

      case TokenType.SYMBOL: {
        // ast[2][1] is the parameter.
        if (typeof ast[1] !== 'string') throw new GenerateError(`Expected string for command. Found ${typeof ast[1]}`);

        if (isCommand(JMP_COMMAND_SYMBOL, ast[1])) {
          const gJump = generateJump(ast, { environment: this.environment });
          return gJump;
        } else if (isCommand(SHOW_COMMAND_SYMBOL, ast[1])) {
          const gShow = generateShow(ast, { environment: this.environment });
          return gShow;
        }

        throw new GenerateError(`Command '${ast[1]}' not found`);
      }
      default:
        throw new GenerateError(`Token ${ast[2][0]} '${ast[2][1]}' is not implemented`);
    }
  }
}

export function* generate(stream: Generator<AST>, environment = new Environment()) {
  const g = new _Generator(stream, environment);
  if (_Generator.depth === 1) g.preGenerate();

  while (g.hasNext()) {
    const generated = g.generate();
    if (generated) yield generated;
  }
}
