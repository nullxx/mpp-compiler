import { AST, TokenType } from '../types';
import { GenerateError } from '../error';
import { Label } from '../instruction';
import { generate } from '.';
import { createGenerator, generatorToSingleArray } from '../utils/function';
import { EnvironmentOption } from './_environment';

interface _Label {
  name: string;
  ast: AST;
  address?: number;
}

function parseParserLabel(ast: AST): _Label {
  const [type, value, next] = ast;

  if (type !== TokenType.SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL}`);
  if (!next || !Array.isArray(next)) throw new GenerateError(`Expected AST array. Found ${next}`);
  if (next[0] !== TokenType.SEPARATOR) throw new GenerateError(`Expected ${TokenType.SEPARATOR}. Found ${next[0]}`);

  if (typeof value !== 'string') throw new GenerateError(`Expected label to be a string. Found ${typeof value}`);
  if (!next[1] || !Array.isArray(next[1])) throw new GenerateError(`Expected body label. Found ${next[1]}`);

  return {
    name: value,
    ast: next[1],
  };
}

function _generateLabel(label: _Label, { environment }: EnvironmentOption) {
  const lbl = environment.getLabel(label.name);

  const generator = createGenerator(label.ast);
  const generated = generate(generator, environment);

  const generatedArr = generatorToSingleArray(generated);
  if (generatedArr.length > 0) generatedArr[0].labeled = lbl; // inject the label

  return generatedArr;
}

export function generateLabel(ast: AST, { environment }: EnvironmentOption) {
  return _generateLabel(parseParserLabel(ast), { environment });
}

export function preGenerateLabel(ast: AST, { environment }: EnvironmentOption): void {
  const parsed = parseParserLabel(ast);
  const lbl = new Label(parsed.name, 'user');
  environment.addLabel(lbl);
}
