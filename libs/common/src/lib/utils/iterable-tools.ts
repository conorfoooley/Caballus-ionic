export function flatMap<T, K>(collection: Iterable<T>, mapFn: (value: T) => K[]): K[] {
    let accumulator = [];
    for (const value of collection) {
        const newValue = mapFn(value);
        accumulator = accumulator.concat(newValue);
    }

    return accumulator;
}
