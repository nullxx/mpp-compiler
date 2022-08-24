export function sum(numbers: number[]) {
  return numbers.reduce(function (a, b) {
    return a + b;
  }, 0);
}
