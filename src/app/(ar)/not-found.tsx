import Link from 'next/link';

/** Arabic-root 404. */
export default function NotFoundAr() {
  return (
    <main id="main" className="container-page section-y flex flex-1 items-center">
      <div className="mx-auto max-w-[44rem] text-center">
        <p className="eyebrow mb-3">٤٠٤</p>
        <h1 className="display-2">لا يوجد شيء على هذا العنوان.</h1>
        <p className="lede mx-auto mt-4 max-w-[32rem]">
          إمّا أن الصفحة انتقلت أو أنها لم توجد أصلاً.
        </p>
        <Link href="/ar/signature" className="btn mt-8">
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </main>
  );
}
