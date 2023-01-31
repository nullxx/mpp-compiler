import { formatHexValue, formatHexDir } from './number';
import { Variable } from './generator/_variable';
import { InstructionFormatError } from './error';
import { Identificable } from './utils/function';

export class Label extends Identificable {
  address?: number;

  constructor(public name: string, public type: 'user' | 'internal') {
    super();
  }
}

export enum Register {
  AC = 'AC',
  RB = 'RB',
  RC = 'RC',
  RD = 'RD',
  RE = 'RE',
}

export enum Mnemonic {
  MOV = 'MOV',
  SUB = 'SUB',
  CMP = 'CMP',
  AND = 'AND',
  OR = 'OR',
  XOR = 'XOR',
  INC = 'INC',
  ADD = 'ADD',
  CMA = 'CMA',
  LDA = 'LDA',
  STA = 'STA',
  STAX = 'STAX',
  LDAX = 'LDAX',
  PUSH = 'PUSH',
  POP = 'POP',
  INISP = 'INISP',
  BEQ = 'BEQ',
  BC = 'BC',
  JMP = 'JMP',
  LFA = 'LFA',
  SFA = 'SFA',
  CALL = 'CALL',
  RET = 'RET',
  IRET = 'IRET',
  FIN = 'FIN',
}
export class PendingDirFromVariable {
  constructor(public variable: Variable) {}
}

export class PendingDirFromLabel {
  constructor(public label: Label) {}
}

export interface InstructionOptions {
  destignatesVariable?: Variable; // when doing STA
  labeled?: Label;
  isPlaceholder?: boolean;
}
export type Dir = number | PendingDirFromVariable | PendingDirFromLabel;

export abstract class Instruction {
  value?: number;
  dir?: number | PendingDirFromVariable | PendingDirFromLabel;
  source?: Register;
  destination?: Register;
  destignatesVariable?: Variable; // when doing STA
  labeled?: Label;
  isPlaceholder? = false;

  constructor(
    public mnemonic: Mnemonic | null,
    {
      value,
      dir,
      source,
      destination,
      destignatesVariable,
      labeled,
      isPlaceholder,
    }: {
      value?: number;
      dir?: number | PendingDirFromVariable | PendingDirFromLabel;
      source?: Register;
      destination?: Register;
      destignatesVariable?: Variable;
      labeled?: Label;
      isPlaceholder?: boolean;
    } = {},
  ) {
    this.value = value;
    this.dir = dir;
    this.source = source;
    this.destination = destination;
    this.destignatesVariable = destignatesVariable;
    this.labeled = labeled;
    this.isPlaceholder = isPlaceholder;
  }

  getCost(): number {
    if (!this.mnemonic) return 0;

    let sum = 0;

    if (this.source != null || this.destination != null) {
      sum += 1; // 8 bits
    } else if (this.mnemonic != null) {
      sum += 1; // 8 bits
    }

    if (this.value != null) {
      sum += 1; // 8 bits
    }

    if (this.dir != null || this.destignatesVariable != null) {
      sum += 2; // 16 bits
    }

    return sum;
  }

  format(debug = false) {
    let str = '';
    if (this.source != null && this.destination != null) {
      str = `${this.mnemonic} ${this.source}, ${this.destination}`;
    } else if (this.value != null && this.destination != null) {
      const valueHex = formatHexValue(this.value);
      str = `${this.mnemonic} ${valueHex}, ${this.destination}`;
    } else if (this.value != null) {
      const valueHex = formatHexValue(this.value);
      str = `${this.mnemonic} ${valueHex}`;
    } else if (this.source != null) {
      str = `${this.mnemonic} ${this.source}`;
    } else if (this.dir === undefined && this.destignatesVariable != null) {
      if (!this.destignatesVariable?.address) throw new InstructionFormatError(`Could not retrieve address from designates variable ${this.destignatesVariable.name}`);
      const dirHex = formatHexDir(this.destignatesVariable.address);
      str = `${this.mnemonic} ${dirHex}`;
    } else if (this.dir instanceof PendingDirFromVariable) {
      if (!this.dir.variable?.address) throw new InstructionFormatError(`Could not retrieve address from variable '${this.dir.variable.name}'`);

      const dirHex = formatHexDir(this.dir.variable.address);
      str = `${this.mnemonic} ${dirHex}`;
    } else if (this.dir instanceof PendingDirFromLabel) {
      if (this.dir.label?.address === undefined) throw new InstructionFormatError(`Could not retrieve address from label '${this.dir.label.name}'`);
      const dirHex = formatHexDir(this.dir.label.address);
      str = `${this.mnemonic} ${dirHex}`;
    } else if (this.dir != null) {
      const dirHex = formatHexDir(this.dir);
      str = `${this.mnemonic} ${dirHex}`;
    } else {
      str = this.mnemonic ?? '';
    }

    if (debug && this.labeled) {
      str = `${this.labeled.name}: ${str}`;
    }
    if (debug) {
      str = `${this.getCost()} bytes: ${str}`;
    }

    return str;
  }

  equals(other: Instruction | null) {
    return other != null && this.mnemonic === other.mnemonic && this.value === other.value && this.dir === other.dir && this.source === other.source && this.destination === other.destination && this.destignatesVariable?.name === other.destignatesVariable?.name && this.labeled?.name === other.labeled?.name;
  }
}

export class MOV extends Instruction {
  public constructor(sourceReg: Register, destinationReg: Register, opts?: InstructionOptions);
  public constructor(value: number, destinationReg: Register, opts?: InstructionOptions);

  constructor(...args: (Register | number | InstructionOptions | undefined)[]) {
    if (args.length < 2) throw new Error('Invalid number of arguments');

    const opts = args.length === 3 && typeof args[2] === 'object' ? args[2] : {};

    if (typeof args[0] === 'number' && typeof args[1] === 'string') {
      super(Mnemonic.MOV, { value: args[0], destination: args[1], ...opts });
    } else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
      super(Mnemonic.MOV, { source: args[0], destination: args[1], ...opts });
    }
  }
}

export class ADD extends Instruction {
  public constructor(value: number);
  public constructor(registerOperand: Register);

  constructor(...args: (Register | number)[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    if (typeof args[0] === 'number') {
      super(Mnemonic.ADD, { value: args[0] });
    } else if (typeof args[0] === 'string') {
      super(Mnemonic.ADD, { source: args[0] });
    }
  }
}

export class SUB extends Instruction {
  public constructor(value: number);
  public constructor(registerOperand: Register);

  constructor(...args: (Register | number)[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    if (typeof args[0] === 'number') {
      super(Mnemonic.SUB, { value: args[0] });
    } else if (typeof args[0] === 'string') {
      super(Mnemonic.SUB, { source: args[0] });
    }
  }
}

export class CMP extends Instruction {
  public constructor(value: number);
  public constructor(registerOperand: Register);

  constructor(...args: (Register | number)[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    if (typeof args[0] === 'number') {
      super(Mnemonic.CMP, { value: args[0] });
    } else if (typeof args[0] === 'string') {
      super(Mnemonic.CMP, { source: args[0] });
    }
  }
}

export class BEQ extends Instruction {
  public constructor(label: Label);

  constructor(...args: Label[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    super(Mnemonic.BEQ, { dir: new PendingDirFromLabel(args[0]) });
  }
}

export class JMP extends Instruction {
  public constructor(label: Label);

  constructor(...args: Label[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    super(Mnemonic.JMP, { dir: new PendingDirFromLabel(args[0]) });
  }
}

export class LDA extends Instruction {
  public constructor(label: Variable);

  constructor(...args: Variable[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    super(Mnemonic.LDA, { dir: new PendingDirFromVariable(args[0]) });
  }
}

export class STA extends Instruction {
  public constructor(designatesVariable: Variable);

  constructor(...args: Variable[]) {
    if (args.length !== 1) throw new Error('Invalid number of arguments');

    super(Mnemonic.STA, { destignatesVariable: args[0] });
  }
}

export class FIN extends Instruction {
  public constructor();

  constructor() {
    super(Mnemonic.FIN);
  }
}

export class NOP extends Instruction {
  public constructor(options: InstructionOptions);

  constructor(options: InstructionOptions) {
    super(null, options);
  }
}
