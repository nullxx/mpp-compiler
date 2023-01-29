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

export type Mnemonic = 'MOV' | 'SUB' | 'CMP' | 'AND' | 'OR' | 'XOR' | 'INC' | 'ADD' | 'CMA' | 'LDA' | 'STA' | 'STAX' | 'LDAX' | 'PUSH' | 'POP' | 'INISP' | 'BEQ' | 'BC' | 'JMP' | 'LFA' | 'SFA' | 'CALL' | 'RET' | 'IRET' | 'FIN';
export type Register = 'AC' | 'RB' | 'RC' | 'RD' | 'RE';

export class PendingDirFromVariable {
  constructor(public variable: Variable) {}
}

export class PendingDirFromLabel {
  constructor(public label: Label) {}
}

export class Instruction {
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
      str =  `${this.mnemonic} ${valueHex}, ${this.destination}`;

    } else if (this.value != null) {
      const valueHex = formatHexValue(this.value);
      str =  `${this.mnemonic} ${valueHex}`;

    } else if (this.source != null) {
      str =  `${this.mnemonic} ${this.source}`;

    } else if (this.dir === undefined && this.destignatesVariable != null) {
      if (!this.destignatesVariable?.address) throw new InstructionFormatError(`Could not retrieve address from designates variable ${this.destignatesVariable.name}`);
      const dirHex = formatHexDir(this.destignatesVariable.address);
      str =  `${this.mnemonic} ${dirHex}`;

    } else if (this.dir instanceof PendingDirFromVariable) {
      if (!this.dir.variable?.address) throw new InstructionFormatError(`Could not retrieve address from variable '${this.dir.variable.name}'`);

      const dirHex = formatHexDir(this.dir.variable.address);
      str =  `${this.mnemonic} ${dirHex}`;

    } else if (this.dir instanceof PendingDirFromLabel) {
      if (this.dir.label?.address === undefined) throw new InstructionFormatError(`Could not retrieve address from label '${this.dir.label.name}'`);
      const dirHex = formatHexDir(this.dir.label.address);
      str =  `${this.mnemonic} ${dirHex}`;

    } else if (this.dir != null) {
      const dirHex = formatHexDir(this.dir);
      str =  `${this.mnemonic} ${dirHex}`;
    } else {
      str =  this.mnemonic ?? '';
    }

    if (debug && this.labeled) {
      str = `${this.labeled.name}: ${str}`;
    }
    if (debug) {
      str = `${this.getCost()} bytes: ${str}`;
    }

    return str;
  }
}
