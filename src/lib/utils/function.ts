import { randomString } from "./string";

export function* createGenerator<T>(obj: T) {
  yield obj;
}

export function* createGeneratorFromArray<T>(arr: T[]) {
  for (const item of arr) yield item;
}

export function generatorToSingleArray<T>(result: Generator<T[]>) {
  const results: T[] = [];

  let _result: IteratorResult<T[]>;

  while ((_result = result.next()) && !_result.done) results.push(..._result.value);

  return results;
}

export function generatorToArray<T>(result: Generator<T[] | T>) {
  const results = [];

  let _result;
  while ((_result = result.next()) && !_result.done) results.push(_result.value);

  return results;
}


export class Identificable {
  static ID_LENGTH = 4;
  public id: string;
  constructor() {
    this.id = randomString(Identificable.ID_LENGTH);
  }

  public toString() {
    return this.id;
  }
}