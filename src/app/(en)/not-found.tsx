import Link from 'next/link';
import { tierOrder, tiers } from '@/lib/config/navigation';

/** Site-level 404, for paths outside any tier. Tiers have their own. */
export default function NotFound() {
  return (
    <main id="main" className="container-page section-y flex flex-1 items-center">
      <div className="mx-auto max-w-[44rem] text-center">
        <p className="eyebrow mb-3">404</p>
        <h1 className="display-2">There is nothing at that address.</h1>
        <p className="lede mx-auto mt-4 max-w-[32rem]">
          The page has moved or never existed. Here are the three that definitely do.
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {tierOrder.map((id) => (
            <li key={id}>
              <Link href={`/${id}`} className="btn btn-secondary">
                {tiers[id].name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
