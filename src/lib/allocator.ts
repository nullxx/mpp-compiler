import { FIN, Instruction } from './instruction';
import { sum } from './utils/math';
import { AllocationError } from './error';

interface AllocatorOptions {
  initialOffset?: number;
  endInstruction?: boolean;
}

export function* allocate(stream: Generator<Instruction[]>, { initialOffset = 0, endInstruction = true }: AllocatorOptions) {
  let instructions: Instruction[] = [];

  let instruction;
  while ((instruction = stream.next()) && !instruction.done) {
    instructions.push(...instruction.value);
  }

  if (endInstruction) {
    // we want to add a 'FIN' instruction at the end
    instructions.push(new FIN());
  }

  const occupated = sum(instructions.map((i) => i.getCost()));

  // this is obvious
  const lastAddresOccupated = initialOffset + occupated - 1;
  let nextFreeAddress = lastAddresOccupated + 1;

  // find the instructions that define their variable address
  const instructionsDesignatesVariable = instructions.filter((i) => i.destignatesVariable !== undefined);

  instructionsDesignatesVariable.forEach((idv) => {
    if (!idv.destignatesVariable) throw new AllocationError('Designates variable with no attached variable');

    if (!idv.destignatesVariable.isAssigned) {
      const variableAddress = nextFreeAddress++;
      idv.destignatesVariable.address = variableAddress;
    }
  });

  const labeledInstructions = instructions.filter((i) => i.labeled !== undefined);

  labeledInstructions.forEach((li) => {
    if (!li.labeled) throw new AllocationError(`Labeled instruction with no attached label`);

    // label address will be the allocated until this li
    const originalIndex = instructions.indexOf(li);
    const instructionsBeforeThis = originalIndex === 0 ? [] : instructions.slice(0, originalIndex);
    const allocatedBeforeThis = sum(instructionsBeforeThis.map((i) => i.getCost()));

    const lastAddressAllocated = initialOffset + allocatedBeforeThis - 1;

    const labelAddress = lastAddressAllocated + 1;
    li.labeled.address = labelAddress;
  });

  instructions = instructions.filter((i) => i.isPlaceholder !== true);

  for (instruction of instructions) {
    yield instruction;
  }
}
