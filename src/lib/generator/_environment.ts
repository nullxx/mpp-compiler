import { Variable } from './_variable';
import { Label } from '../instruction';

export class Environment {
  variables: Variable[];
  labels: Label[];

  constructor() {
    this.variables = [];
    this.labels = [];
  }

  hasVariable(variable: Variable | string) {
    return Boolean(this.getVariable(variable));
  }

  getVariable(variable: Variable | string) {
    return this.variables.find((v) => v.name === (typeof variable === 'string' ? variable : variable.name));
  }

  addVariable(variable: Variable) {
    const exists = this.hasVariable(variable);
    if (!exists) this.variables.push(variable);
    return !exists;
  }

  hasLabel(label: Label | string) {
    return Boolean(this.getLabel(label));
  }

  getLabel(label: Label | string) {
    if (label instanceof Label && label.type === 'internal') {
      return this.labels.find((v) => v.id === label.id);
    }

    return this.labels.find((v) => v.name === (typeof label === 'string' ? label : label.name));
  }

  addLabel(label: Label) {
    const exists = this.hasLabel(label);
    if (!exists) this.labels.push(label);
    return !exists;
  }
}

export type EnvironmentOption = { environment: Environment };
