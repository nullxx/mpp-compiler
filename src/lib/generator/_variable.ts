import { randomString } from '../utils/string';

export class Variable {
  static ID_LENGTH = 4;

  id: string;
  private _address?: number;

  constructor(public name: string) {
    this.id = randomString(Variable.ID_LENGTH);
  }

  set address(address: number | undefined) {
    this._address = address;
  }

  get address(): number | undefined {
    return this._address;
  }

  get isAssigned() {
    return Boolean(this.address);
  }

  public toString() {
    return this.id;
  }
}
