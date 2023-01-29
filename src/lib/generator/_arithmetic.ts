import { AST, TokenType } from '../types';
import { Instruction, Label, PendingDirFromLabel, PendingDirFromVariable } from '../instruction';
import { parseNumber } from '../number';
import { GenerateError } from '../error';
import { EnvironmentOption } from './_environment';

interface Operation {
  operator: 'ADD' | 'SUB' | 'MULT';
  value?: number;
  variableName?: string;
}

function parseParseArithmetic(ast: AST, operator: 'ADD' | 'SUB' | 'MULT'): Operation[] {
  const operations = [];

  const [type, value, next] = ast;
  if (type === TokenType.NUMBER) {
    if (value === null) throw new GenerateError('Expected string number. Found null');

    if (typeof value !== 'string') throw new GenerateError('Expected string. Found ' + typeof value);

    const number = parseNumber(value);
    if (number === null) throw new GenerateError('Number ' + value + ' is not valid');

    operations.push({
      operator,
      value: number,
    });
  } else if (type === TokenType.SYMBOL) {
    if (typeof value !== 'string') throw new GenerateError('Expected string. Found ' + typeof value);
    operations.push({ variableName: value, operator });
  }
  if (type === TokenType.PLUS && value) {
    if (typeof value === 'string') throw new GenerateError('Expected AST array. Found string');

    operations.push(...parseParseArithmetic(value, 'ADD'));
  } else if (type === TokenType.MINUS && value) {
    if (typeof value === 'string') throw new GenerateError('Expected AST array. Found string');

    operations.push(...parseParseArithmetic(value, 'SUB'));
  } else if (type === TokenType.MULTIPLY && value) {
    if (typeof value === 'string') throw new GenerateError('Expected AST array. Found string');

    operations.push(...parseParseArithmetic(value, 'MULT'));
  }

  if (next) {
    if (typeof next === 'string') throw new GenerateError('Expected Array. Found string');

    operations.push(...parseParseArithmetic(next, operator));
  }

  return operations;
}

export function _generateArithmetic(operations: Operation[], { environment }: EnvironmentOption): Instruction[] {
  const instructions: Instruction[] = [];
  for (const operation of operations) {
    if (instructions.length === 0 && operation.value !== undefined) {
      instructions.push(
        new Instruction('MOV', {
          destination: 'AC',
          value: operation.value,
        }),
      );
      continue;
    } else if (instructions.length === 0 && operation.variableName !== undefined) {
      const fromVariable = environment.getVariable(operation.variableName);
      if (!fromVariable) throw new GenerateError(`Referenced variable '${operation.variableName}' not defined`);

      instructions.push(
        new Instruction('LDA', {
          dir: new PendingDirFromVariable(fromVariable),
        }),
      );
      continue;
    } else if (instructions.length === 0) {
      throw new GenerateError(`Operation ${operation} has no value or variableName`);
    }

    if (operation.value !== undefined && (operation.operator === 'ADD' || operation.operator === 'SUB')) instructions.push(new Instruction(operation.operator, { value: operation.value }));
    if (operation.variableName !== undefined && (operation.operator === 'ADD' || operation.operator === 'SUB')) {
      const fromVariable = environment.getVariable(operation.variableName);
      if (!fromVariable) throw new GenerateError(`Referenced variable '${operation.variableName}' not defined`);

      instructions.push(
        new Instruction('MOV', { source: 'AC', destination: 'RC' }),
        new Instruction('LDA', {
          dir: new PendingDirFromVariable(fromVariable),
        }),
        new Instruction('MOV', { source: 'AC', destination: 'RB' }),
        new Instruction('MOV', { source: 'RC', destination: 'AC' }),
        new Instruction(operation.operator, { source: 'RB' }),
      );
    }

    // could be optimized a lot. Could check what of the values is bigger and then do the loop with the smaller value (and add the bigger)
    if (operation.value !== undefined && operation.operator === 'MULT') {
      const multStartLabel = new Label('MULT_START', 'internal');
      const multEndLabel = new Label('MULT_END', 'internal');
      instructions.push(
        new Instruction('MOV', { source: 'AC', destination: 'RC' }),
        new Instruction('MOV', { value: 0, destination: 'RD' }),
        new Instruction('MOV', { source: 'RC', destination: 'AC', labeled: multStartLabel }),
        new Instruction('CMP', { value: 0 }),
        new Instruction('BEQ', { dir: new PendingDirFromLabel(multEndLabel) }),
        // new Instruction('POP'),
        new Instruction('MOV', { source: 'RD', destination: 'AC' }),
        new Instruction('ADD', { value: operation.value }),
        // new Instruction('PUSH'),
        new Instruction('MOV', { source: 'AC', destination: 'RD' }),
        new Instruction('MOV', { source: 'RC', destination: 'AC' }),
        new Instruction('SUB', { value: 1 }),
        new Instruction('MOV', { source: 'AC', destination: 'RC' }),
        new Instruction('JMP', { dir: new PendingDirFromLabel(multStartLabel) }),
        // new Instruction('POP', { labeled: multEndLabel }),
        new Instruction('MOV', { source: 'RD', destination: 'AC', labeled: multEndLabel }),
      );
    }

    if (operation.variableName !== undefined && operation.operator === 'MULT') {
      const fromVariable = environment.getVariable(operation.variableName);
      if (!fromVariable) throw new GenerateError(`Referenced variable '${operation.variableName}' not defined`);

  
      const multStartLabel = new Label('MULT_START', 'internal');
      const multEndLabel = new Label('MULT_END', 'internal');
      instructions.push(
        new Instruction('MOV', { source: 'AC', destination: 'RC' }),
        new Instruction('MOV', { value: 0, destination: 'RD' }),
        new Instruction('MOV', { source: 'RC', destination: 'AC', labeled: multStartLabel }),
        new Instruction('CMP', { value: 0 }),
        new Instruction('BEQ', { dir: new PendingDirFromLabel(multEndLabel) }),
        // new Instruction('POP'),
        new Instruction('MOV', { source: 'RD', destination: 'RB' }),
        new Instruction('LDA', {
          dir: new PendingDirFromVariable(fromVariable),
        }),
        new Instruction('ADD', { source: 'RB' }),
        // new Instruction('PUSH'),
        new Instruction('MOV', { source: 'AC', destination: 'RD' }),
        new Instruction('MOV', { source: 'RC', destination: 'AC' }),
        new Instruction('SUB', { value: 1 }),
        new Instruction('MOV', { source: 'AC', destination: 'RC' }),
        new Instruction('JMP', { dir: new PendingDirFromLabel(multStartLabel) }),
        // new Instruction('POP', { labeled: multEndLabel }),
        new Instruction('MOV', { source: 'RD', destination: 'AC', labeled: multEndLabel }),
      );
    }
  }

  return instructions;
}

export function generateArithmetic(ast: AST, { environment }: EnvironmentOption): Instruction[] {
  return _generateArithmetic(parseParseArithmetic(ast, 'ADD'), { environment });
}

// const ast: AST = ["NUMBER", "0d1"];

// const ast: AST = [
//   "NUMBER",
//   "0d1",
//   [
//     "+",
//     [
//       "NUMBER",
//       "0d2",
//       [
//         "+",
//         ["NUMBER", "0d3", ["-", ["NUMBER", "0d4", ["-", ["SYMBOL", "num"]]]]],
//       ],
//     ],
//   ],
// ];

// const parsedArithmeticOperations = parseParserArithmeticOperations(ast, "ADD");
// console.log(parsedArithmeticOperations);

// const arithmeticInstructions = generateArithmeticOperation(
//   parsedArithmeticOperations
// );
// console.log(arithmeticInstructions.map((I) => I.format()));
