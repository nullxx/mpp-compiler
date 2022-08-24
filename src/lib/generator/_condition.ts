import { AST, TokenType } from '../types';
import { GenerateError } from '../error';
import { EnvironmentOption } from './_environment';
import { generateArithmetic } from './_arithmetic';
import { Instruction, Label, PendingDirFromLabel } from '../instruction';
import { generate } from '.';
import { createGenerator, generatorToSingleArray } from '../utils/function';

type _Operator = '==' | '!=';
type _ConditionalTerminators = _Operator | ')';

interface _Condition {
  leftConditional: AST;
  rightConditional: AST;
  operator: _Operator;
  body: AST;
}

const CONDITION_KEYWORD = 'if';
const SUPPORTED_OPERATORS: _Operator[] = ['==', '!='];

export function isCondition(ast: AST) {
  const [type, value] = ast;
  if (type !== TokenType.SYMBOL) return false;

  return value === CONDITION_KEYWORD;
}

function _scanFor<T extends _ConditionalTerminators>(terminator: T[], ast: AST): [AST, T?, AST?] {
  const [type, value, next] = ast;

  if (next && terminator.includes(next[0] as T)) {
    if (!next[1] || !Array.isArray(next[1])) throw new GenerateError(`Expected next AST array after conditional terminatr ${terminator.join(', ')}. Found ${next[1]}`);
    return [[type, value], next[0] as T, next[1]];
  } else if (value && terminator.includes(value[0] as T)) {
    if (!value[1] || !Array.isArray(value[1])) throw new GenerateError(`Expected next AST array after conditional terminatr ${terminator.join(', ')}. Found ${value[1]}`);
    return [[type, value], value[0] as T, value[1]];
  } else if ((!next || !Array.isArray(next)) && terminator.length === 0) {
    return [[type, value]];
  }

  if (next && Array.isArray(next)) return _scanFor(terminator, next);
  if (value && Array.isArray(value)) return _scanFor(terminator, value);

  throw new GenerateError(`Expected next finding for conditional terminator ${terminator.join(', ')}. Found ´${next}`);
}

function parseParseCondition(ast: AST): _Condition {
  const [type, value, next] = ast;
  if (type !== TokenType.SYMBOL || value !== CONDITION_KEYWORD) throw new GenerateError(`Condition expected ${TokenType.SYMBOL} '${CONDITION_KEYWORD}'. Found '${value}'`);
  if (!next || !Array.isArray(next)) throw new GenerateError(`Expected condition conditional. Found '${next}'`);

  if (next[0] !== TokenType.LPAREN) throw new GenerateError(`Expected condition conditional '${TokenType.LPAREN}'. Found '${next[0]}'`);
  if (!next[2] || next[2][0] !== TokenType.RPAREN) throw new GenerateError(`Expected condition conditional '${TokenType.RPAREN}'. Found '${next?.[2]?.[0]}'`);

  if (!next[2]?.[1]?.[0] || next[2][1][0] !== TokenType.SEPARATOR) throw new GenerateError(`Expected '${TokenType.SEPARATOR}' after if conditional. Found  ${next[2]?.[1]?.[1]}`);
  if (!Array.isArray(next[2][1][1])) throw new GenerateError(`Expected condition body to be an AST array. Found ${next[2][1][1]}`);

  if (!next[1] || typeof next[1] === 'string') throw new GenerateError(`Expected left condition conditional. Found '${next[1]}'`);

  const [leftConditional, op, after] = _scanFor<Extract<_Operator, _ConditionalTerminators> | Extract<'!=', _ConditionalTerminators>>(['==', '!='], next[1]);
  if (!op) throw new GenerateError(`Not found expected condition conditional operator`);
  if (!after || !Array.isArray(after)) throw new GenerateError(`Expected right condition source. Found ${after}`);
  const [rightConditional] = _scanFor([], after);

  return {
    body: next[2][1][1],
    operator: op,
    leftConditional,
    rightConditional,
  };
}

function _generateConditon(condition: _Condition, { environment }: EnvironmentOption) {
  const instructions: Instruction[] = [];

  const generatedLeft = generateArithmetic(condition.leftConditional, { environment });
  instructions.push(...generatedLeft);
  instructions.push(new Instruction('MOV', { source: 'AC', destination: 'RB' }));

  const generatedRight = generateArithmetic(condition.rightConditional, { environment });
  instructions.push(...generatedRight);

  instructions.push(new Instruction('CMP', { source: 'RB' }));

  const lblContinue = new Label('', 'internal');
  const lblCondition = new Label('', 'internal');

  environment.addLabel(lblCondition);
  environment.addLabel(lblContinue);

  if (condition.operator === '==') {
    const beq = new Instruction('BEQ', { dir: new PendingDirFromLabel(lblCondition) });
    instructions.push(beq);

    const jmp = new Instruction('JMP', { dir: new PendingDirFromLabel(lblContinue) });
    instructions.push(jmp);

    const generatorBody = createGenerator(condition.body);
    const generatedBody = generate(generatorBody, environment);

    const generatedBodyArr = generatorToSingleArray(generatedBody);
    if (generatedBodyArr.length > 0) generatedBodyArr[0].labeled = lblCondition; // inject the label
    instructions.push(...generatedBodyArr);

    instructions.push(new Instruction(null, { isPlaceholder: true, labeled: lblContinue }));
  } else if (condition.operator === '!=') {

    const beq = new Instruction('BEQ', { dir: new PendingDirFromLabel(lblContinue) });
    instructions.push(beq);

    const generatorBody = createGenerator(condition.body);
    const generatedBody = generate(generatorBody, environment);

    const generatedBodyArr = generatorToSingleArray(generatedBody);
    if (generatedBodyArr.length > 0) generatedBodyArr[0].labeled = lblCondition; // not necessary but nice to have
    instructions.push(...generatedBodyArr);

    instructions.push(new Instruction(null, { isPlaceholder: true, labeled: lblContinue }));
  } else {
    throw new GenerateError(`Condition conditional operator '${condition.operator}' not implemented`);
  }

  return instructions;
}

export function generateCondition(ast: AST, { environment }: EnvironmentOption) {
  return _generateConditon(parseParseCondition(ast), { environment });
}
