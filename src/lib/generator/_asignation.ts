import { AST, TokenType } from '../types';
import { GenerateError } from '../error';
import { generateArithmetic } from './_arithmetic';
import { Instruction, STA } from '../instruction';
import { EnvironmentOption } from './_environment';
import { Variable } from './_variable';

interface Asignation {
  variableName: string;
  ast: AST;
}

export function parseParserAsignation(ast: AST): Asignation | null {
  const [type, value, next] = ast;
  if (type !== TokenType.SYMBOL) return null;
  if (!next) return null;
  if (next[0] !== TokenType.ASSIGN) return null;

  if (typeof value !== 'string') throw new GenerateError(`Expected variable name to be a string. Found ${typeof value}`);

  if (typeof next[1] === 'string' || next[1] === null) throw new GenerateError('Expected an asignation body.');

  return {
    variableName: value,
    ast: next[1],
  };
}

function _generateAsignation(asignation: Asignation | null, { environment }: EnvironmentOption): Instruction[] {
  const instructions = [];
  if (asignation === null) return [];

  const asignationBody = generateArithmetic(asignation.ast, { environment });
  instructions.push(...asignationBody);

  const variable = environment.getVariable(asignation.variableName) ?? new Variable(asignation.variableName);
  environment.addVariable(variable);

  instructions.push(
    new STA(variable),
  );

  return instructions;
}

export function generateAsignation(ast: AST, { environment }: EnvironmentOption): Instruction[] {
  return _generateAsignation(parseParserAsignation(ast), { environment });
}
