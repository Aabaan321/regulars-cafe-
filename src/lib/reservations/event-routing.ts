/**
 * Where a private-hire enquiry should land.
 *
 * Real rules rather than a single shared inbox: the events team handles
 * ordinary sittings, anything over forty guests or a whole-venue evening goes
 * to private hire, a five-figure budget goes to the owner directly, and a
 * headcount the room physically cannot seat is flagged so somebody replies
 * honestly instead of quoting for it.
 *
 * Lives outside the `'use server'` module because a server-actions file may
 * only export async functions — a sync export there fails the build with
 * "Server Actions must be async functions".
 */

export type EventRoute = 'events_team' | 'private_hire' | 'owner' | 'declined_capacity';

/** Standing capacity of the whole warehouse. */
const VENUE_CAPACITY = 70;
/** Above this it stops being a sitting and becomes a venue hire. */
const PRIVATE_HIRE_THRESHOLD = 40;
/** AED 20,000, in fils. */
const OWNER_BUDGET_THRESHOLD = 2_000_000;

export interface EventRoutingInput {
  readonly headcount: number;
  readonly budgetFils?: number;
  readonly eventType: string;
}

export interface EventRouting {
  readonly route: EventRoute;
  readonly reason: string;
}

export function routeEventEnquiry(input: EventRoutingInput): EventRouting {
  if (input.headcount > VENUE_CAPACITY) {
    return {
      route: 'declined_capacity',
      reason: `${input.headcount} guests is beyond the venue's ${VENUE_CAPACITY} standing capacity`,
    };
  }
  if ((input.budgetFils ?? 0) >= OWNER_BUDGET_THRESHOLD) {
    return { route: 'owner', reason: 'Budget at or above AED 20,000' };
  }
  if (
    input.headcount > PRIVATE_HIRE_THRESHOLD ||
    input.eventType === 'private_hire' ||
    input.eventType === 'launch'
  ) {
    return {
      route: 'private_hire',
      reason: `${input.headcount} guests · ${input.eventType.replace(/_/g, ' ')}`,
    };
  }
  return { route: 'events_team', reason: `${input.headcount} guests · standard sitting` };
}
