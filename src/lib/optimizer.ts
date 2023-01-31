import type { Instruction } from './instruction';

interface Env {
  lastInstruction: Instruction | null;
}

function optimizeInstruction(instructions: Instruction[], env: Env) {
  const optimized: Instruction[] = [];
  for (const instruction of instructions) {
    if (instruction.equals(env.lastInstruction)) continue; // skip instruction
    // a lot of work to do here. Work is in progress

    optimized.push(instruction);

    env.lastInstruction = instruction;
  }

  return optimized;
}

export function* optimize(instructions: Generator<Instruction[]>): Generator<Instruction[]> {
  let lastIteration: IteratorResult<Instruction[]>;
  const optimizedInstructions: Instruction[] = [];

  const env: Env = { lastInstruction: null };

  while ((lastIteration = instructions.next()) && !lastIteration.done) {
    const instruction = lastIteration.value;
    const optimized = optimizeInstruction(instruction, env);
    optimizedInstructions.push(...optimized);
  }

  yield optimizedInstructions;
}
