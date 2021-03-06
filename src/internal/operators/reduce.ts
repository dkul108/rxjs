import { Observable } from '../Observable';
import { scan } from './scan';
import { takeLast } from './takeLast';
import { defaultIfEmpty } from './defaultIfEmpty';
import { OperatorFunction } from '../types';
import { pipe } from '../util/pipe';

/* tslint:disable:max-line-length */
export function reduce<V, A = V>(accumulator: (acc: A|V, value: V, index: number) => A): OperatorFunction<V, V|A>;
export function reduce<V, A>(accumulator: (acc: A, value: V, index: number) => A, seed: A): OperatorFunction<V, A>;
export function reduce<V, A, S = A>(accumulator: (acc: A|S, value: V, index: number) => A, seed: S): OperatorFunction<V, A>;
/* tslint:enable:max-line-length */

/**
 * Applies an accumulator function over the source Observable, and returns the
 * accumulated result when the source completes, given an optional seed value.
 *
 * <span class="informal">Combines together all values emitted on the source,
 * using an accumulator function that knows how to join a new source value into
 * the accumulation from the past.</span>
 *
 * ![](reduce.png)
 *
 * Like
 * [Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce),
 * `reduce` applies an `accumulator` function against an accumulation and each
 * value of the source Observable (from the past) to reduce it to a single
 * value, emitted on the output Observable. Note that `reduce` will only emit
 * one value, only when the source Observable completes. It is equivalent to
 * applying operator {@link scan} followed by operator {@link last}.
 *
 * Returns an Observable that applies a specified `accumulator` function to each
 * item emitted by the source Observable. If a `seed` value is specified, then
 * that value will be used as the initial value for the accumulator. If no seed
 * value is specified, the first item of the source is used as the seed.
 *
 * ## Example
 * Count the number of click events that happened in 5 seconds
 * ```ts
 * import { fromEvent, interval } from 'rxjs';
 * import { reduce, takeUntil, mapTo } from 'rxjs/operators';
 *
 * const clicksInFiveSeconds = fromEvent(document, 'click').pipe(
 *   takeUntil(interval(5000)),
 * );
 * const ones = clicksInFiveSeconds.pipe(mapTo(1));
 * const seed = 0;
 * const count = ones.pipe(reduce((acc, one) => acc + one, seed));
 * count.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link count}
 * @see {@link expand}
 * @see {@link mergeScan}
 * @see {@link scan}
 *
 * @param {function(acc: A, value: V, index: number): A} accumulator The accumulator function
 * called on each source value.
 * @param {A} [seed] The initial accumulation value.
 * @return {Observable<A>} An Observable that emits a single value that is the
 * result of accumulating the values emitted by the source Observable.
 * @name reduce
 */
export function reduce<V, A>(accumulator: (acc: V | A, value: V, index: number) => A, seed?: any): OperatorFunction<V, V | A> {
  // providing a seed of `undefined` *should* be valid and trigger
  // hasSeed! so don't use `seed !== undefined` checks!
  // For this reason, we have to check it here at the original call site
  // otherwise inside Operator/Subscriber we won't know if `undefined`
  // means they didn't provide anything or if they literally provided `undefined`
  if (arguments.length >= 2) {
    return function reduceOperatorFunctionWithSeed(source: Observable<V>): Observable<V | A> {
      return pipe(
        scan(accumulator, seed),
        takeLast(1),
        defaultIfEmpty(seed),
      )(source);
    };
  }
  return function reduceOperatorFunction(source: Observable<V>): Observable<V | A> {
    return pipe(
      scan<V, V | A>((acc, value, index) => accumulator(acc, value, index + 1)),
      takeLast(1),
    )(source);
  };
}
