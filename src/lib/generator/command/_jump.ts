import { AST, TokenType } from '../../types';
import { GenerateError } from '../../error';
import { EnvironmentOption } from '../_environment';
import { Instruction, PendingDirFromLabel } from '../../instruction';
import { JMP_COMMAND_SYMBOL } from './_comands';

interface _ReferencesLabel {
  labelName: string;
}

function parseParserJump(ast: AST): _ReferencesLabel {
  const [type, value, next] = ast;

  if (type !== TokenType.SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL}. Found ${type}`);
  if (value !== JMP_COMMAND_SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL} ${JMP_COMMAND_SYMBOL}. Found ${value}`);
  if (!next || !Array.isArray(next)) throw new GenerateError(`Expected AST array. Found ${next}`);

  if (next[0] !== TokenType.SYMBOL) throw new GenerateError(`Expected ${TokenType.SYMBOL} on label to jump.`);

  if (typeof next[1] !== 'string') throw new GenerateError(`Expected string for label to jump`);

  return { labelName: next[1] };
}

function _generateJump(referencesLabel: _ReferencesLabel, { environment }: EnvironmentOption): Instruction[] {
  const lbl = environment.getLabel(referencesLabel.labelName);

  if (!lbl) throw new GenerateError(`Referenced label '${referencesLabel.labelName}' does not exist`);

  return [
    new Instruction('JMP', {
      dir: new PendingDirFromLabel(lbl),
    }),
  ];
}

export function generateJump(ast: AST, { environment }: EnvironmentOption) {
  return _generateJump(parseParserJump(ast), { environment });
}

// const ast: AST = ['SYMBOL', 'jmp', ['SYMBOL', 'start']];
