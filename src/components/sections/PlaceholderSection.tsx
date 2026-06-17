import { Section, EmptyHint } from "../Section";

// Reusable empty section (same shell as the other report sections). Renders the
// title + a placeholder card once a birth date is entered; swap the body for
// real content/data when ready.
const cardClass =
  "subcard rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition hover:bg-amber-50";

export function PlaceholderSection({ title, birthDate }: { title: string; birthDate: string }) {
  return (
    <Section title={title}>
      {birthDate ? (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className={cardClass}>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-zinc-700">
              内容即将推出。
            </p>
          </div>
        </div>
      ) : (
        <EmptyHint />
      )}
    </Section>
  );
}
