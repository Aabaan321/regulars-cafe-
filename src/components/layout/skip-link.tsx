export function SkipLink({ label }: { label: string }) {
  return (
    <a href="#main" className="sr-only-focusable">
      {label}
    </a>
  );
}
