import { AST, TokenType } from '../types';
import type { Instruction } from '../instruction';
import { ADD, BEQ, CMP, JMP, Label, LDA, MOV, Register, SUB } from '../instruction';
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
      instructions.push(new MOV(operation.value, Register.AC));
      continue;
    } else if (instructions.length === 0 && operation.variableName !== undefined) {
      const fromVariable = environment.getVariable(operation.variableName);
      if (!fromVariable) throw new GenerateError(`Referenced variable '${operation.variableName}' not defined`);

      instructions.push(new LDA(fromVariable));
      continue;
    } else if (instructions.length === 0) {
      throw new GenerateError(`Operation ${operation} has no value or variableName`);
    }

    if (operation.value !== undefined && (operation.operator === 'ADD' || operation.operator === 'SUB')) {
      if (operation.operator === 'ADD') instructions.push(new ADD(operation.value));
      if (operation.operator === 'SUB') instructions.push(new SUB(operation.value));
    }

    if (operation.variableName !== undefined && (operation.operator === 'ADD' || operation.operator === 'SUB')) {
      const fromVariable = environment.getVariable(operation.variableName);
      if (!fromVariable) throw new GenerateError(`Referenced variable '${operation.variableName}' not defined`);

      instructions.push(new MOV(Register.AC, Register.RC), new LDA(fromVariable), new MOV(Register.AC, Register.RB), new MOV(Register.RC, Register.AC));

      if (operation.operator === 'ADD') instructions.push(new ADD(Register.RB));
      if (operation.operator === 'SUB') instructions.push(new SUB(Register.RB));
    }

    // could be optimized a lot. Could check what of the values is bigger and then do the loop with the smaller value (and add the bigger)
    if (operation.value !== undefined && operation.operator === 'MULT') {
      const multStartLabel = new Label('MULT_START', 'internal');
      const multEndLabel = new Label('MULT_END', 'internal');
      instructions.push(
        new MOV(Register.AC, Register.RC),
        new MOV(0, Register.RD),
        new MOV(Register.RC, Register.AC, { labeled: multStartLabel }),
        new CMP(0),
        new BEQ(multEndLabel),
        new MOV(Register.RD, Register.AC),
        new ADD(operation.value),
        new MOV(Register.AC, Register.RD),
        new MOV(Register.RC, Register.AC),
        new SUB(1),
        new MOV(Register.AC, Register.RC),
        new JMP(multStartLabel),
        new MOV(Register.RD, Register.AC, { labeled: multEndLabel }),
      );
    }

    if (operation.variableName !== undefined && operation.operator === 'MULT') {
      const fromVariable = environment.getVariable(operation.variableName);
      if (!fromVariable) throw new GenerateError(`Referenced variable '${operation.variableName}' not defined`);

      const multStartLabel = new Label('MULT_START', 'internal');
      const multEndLabel = new Label('MULT_END', 'internal');
      instructions.push(
        new MOV(Register.AC, Register.RC),
        new MOV(0, Register.RD),
        new MOV(Register.RC, Register.AC, { labeled: multStartLabel }),
        new CMP(0),
        new BEQ(multEndLabel),
        new MOV(Register.RD, Register.RB),
        new LDA(fromVariable),
        new ADD(Register.RB),
        new MOV(Register.AC, Register.RD),
        new MOV(Register.RC, Register.AC),
        new SUB(1),
        new MOV(Register.AC, Register.RC),
        new JMP(multStartLabel),
        new MOV(Register.RD, Register.AC, { labeled: multEndLabel }),
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
