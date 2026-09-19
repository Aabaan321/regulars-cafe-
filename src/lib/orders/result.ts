/**
 * The result shape the order action returns.
 *
 * Lives outside the `'use server'` module because such a file may only export
 * async functions — a type is erased, but keeping the whole contract in one
 * non-server file means the client can import it without any chance of
 * dragging a server binding across the boundary.
 */

export interface SubmittedLine {
  readonly id: string;
  readonly name: string;
  readonly nameAr: string;
  readonly unitPriceFils: number;
  readonly quantity: number;
  readonly lineTotalFils: number;
}

export type OrderFailureCode =
  | 'invalid'
  | 'empty'
  | 'slot_gone'
  | 'unavailable'
  | 'rate_limited'
  | 'rejected'
  | 'no_database'
  | 'failed';

export interface OrderSuccess {
  readonly ok: true;
  readonly reference: string;
  readonly pickupLabel: string;
  readonly totalFils: number;
  readonly vatFils: number;
}

export interface OrderFailure {
  readonly ok: false;
  readonly code: OrderFailureCode;
  readonly message: string;
}

export type OrderResult = OrderSuccess | OrderFailure;
