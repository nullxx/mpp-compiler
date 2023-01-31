import { AST, TokenType } from '../../types';
import { GenerateError } from '../../error';
import { SHOW_COMMAND_SYMBOL } from './_comands';
import { LDA } from '../../instruction';
import { EnvironmentOption } from '../_environment';

interface _Show {
  variableName: string;
}

function parseParserShow(ast: AST): _Show {
  const [type, value, next] = ast;

  if (type !== TokenType.SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL}. Found ${type}`);
  if (value !== SHOW_COMMAND_SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL} ${SHOW_COMMAND_SYMBOL}. Found ${value}`);
  if (!next || !Array.isArray(next)) throw new GenerateError(`Expected AST array. Found ${next}`);

  if (next[0] !== TokenType.SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL} for variable. Found ${next[0]}`);
  if (typeof next[1] !== 'string') throw new GenerateError(`Expected string for variable. Found ${next[1]}`);

  return { variableName: next[1] };
}

function _generateShow(show: _Show, { environment }: EnvironmentOption) {
  const variable = environment.getVariable(show.variableName);
  if (!variable) throw new GenerateError(`Referenced variable '${show.variableName}' does not exist`);

  return [
    new LDA(variable),
  ];
}

export function generateShow(ast: AST, { environment }: EnvironmentOption) {
  return _generateShow(parseParserShow(ast), { environment });
}
