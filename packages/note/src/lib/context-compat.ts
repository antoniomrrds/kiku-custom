type CompatPair<
  TFirst,
  TSecond,
  TFirstKey extends string,
  TSecondKey extends string,
> = readonly [TFirst, TSecond] &
  Record<TFirstKey, TFirst> &
  Record<TSecondKey, TSecond>;

export function createCompatPair<
  TFirst,
  TSecond,
  TFirstKey extends string,
  TSecondKey extends string,
>(
  firstKey: TFirstKey,
  secondKey: TSecondKey,
  first: TFirst,
  second: TSecond,
): CompatPair<TFirst, TSecond, TFirstKey, TSecondKey> {
  return Object.assign([first, second], {
    [firstKey]: first,
    [secondKey]: second,
  }) as unknown as CompatPair<TFirst, TSecond, TFirstKey, TSecondKey>;
}
