import { allocate } from './lib/allocator';
import { generate } from './lib/generator';
import { Instruction } from './lib/instruction';
import { lex } from './lib/lexer';
import { parse } from './lib/parser';

export function parseCode(code: string, initialOffset: number) {
  const lexed = lex(code);
  const parsed = parse(lexed);
  const generated = generate(parsed);
  const allocated = allocate(generated, { initialOffset });

  const instructions = [];
  let res: IteratorResult<Instruction>;
  while ((res = allocated.next()) && !res.done) {
    instructions.push(res.value);
  }

  return instructions;
}
