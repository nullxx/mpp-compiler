export type PeekableStreamResponse<T> = {
  peek: () => IteratorResult<T>;
  peekNext: () => IteratorResult<T>;
  next: () => IteratorResult<T>;
  [Symbol.iterator](): PeekableStreamResponse<T>;
};

function peekableStream<T>(input: Iterable<T>): PeekableStreamResponse<T> {
  const iterator = input[Symbol.iterator]();
  let peeked: IteratorResult<T> | null;

  return {
    peek: () => {
      if (!peeked) peeked = iterator.next();
      return peeked;
    },

    peekNext: () => {
      peeked = iterator.next();
      return peeked;
    },

    next: () => {
      if (peeked) {
        const p = peeked;
        peeked = null;
        return p;
      }
      return iterator.next();
    },

    [Symbol.iterator]() {
      return this;
    },
  };
}

export { peekableStream };
