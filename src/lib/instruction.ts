import { formatHexValue, formatHexDir } from './number';
import { Variable } from './generator/_variable';
import { InstructionFormatError } from './error';
import { randomString } from './utils/string';

export class Label {
  static ID_LENGTH = 4;

  id: string;
  address?: number;

  constructor(public name: string, public type: 'user' | 'internal') {
    this.id = randomString(Label.ID_LENGTH);
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
    },
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
    if (this.source !== undefined && this.destination !== undefined) {
      return 1;
    } else if (this.value !== undefined && this.destination !== undefined) {
      return 2;
    } else if (this.value !== undefined) {
      return 2;
    } else if (this.source !== undefined) {
      return 1;
    } else if (this.dir !== undefined || this.destignatesVariable !== undefined) {
      return 3;
    } else if (this.labeled !== undefined) {
      return 3;
    }
    return 1;
  }

  format() {
    if (this.source !== undefined && this.destination !== undefined) {
      return `${this.mnemonic} ${this.source}, ${this.destination}`;
    } else if (this.value !== undefined && this.destination !== undefined) {
      const valueHex = formatHexValue(this.value);
      return `${this.mnemonic} ${valueHex}, ${this.destination}`;
    } else if (this.value !== undefined) {
      const valueHex = formatHexValue(this.value);
      return `${this.mnemonic} ${valueHex}`;
    } else if (this.source !== undefined) {
      return `${this.mnemonic} ${this.source}`;
    } else if (this.dir === undefined && this.destignatesVariable !== undefined) {
      if (!this.destignatesVariable?.address) throw new InstructionFormatError(`Could not retrieve address from designates variable ${this.destignatesVariable.name}`);

      const dirHex = formatHexDir(this.destignatesVariable.address);
      return `${this.mnemonic} ${dirHex}`;
    } else if (this.dir instanceof PendingDirFromVariable) {
      if (!this.dir.variable?.address) throw new InstructionFormatError(`Could not retrieve address from variable '${this.dir.variable.name}'`);

      const dirHex = formatHexDir(this.dir.variable.address);
      return `${this.mnemonic} ${dirHex}`;
    } else if (this.dir instanceof PendingDirFromLabel) {
      if (this.dir.label?.address === undefined) throw new InstructionFormatError(`Could not retrieve address from label '${this.dir.label.name}'`);

      const dirHex = formatHexDir(this.dir.label.address);
      return `${this.mnemonic} ${dirHex}`;
    } else if (this.dir !== undefined) {
      const dirHex = formatHexDir(this.dir);
      return `${this.mnemonic} ${dirHex}`;
    }
    return this.mnemonic;
  }
}
