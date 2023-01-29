import { Identificable } from '../utils/function';

export class Variable extends Identificable {
  address?: number;

  constructor(public name: string) {
    super();
  }

  get isAssigned() {
    return Boolean(this.address);
  }
}
