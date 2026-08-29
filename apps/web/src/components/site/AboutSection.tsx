interface AboutSectionProps {
  tag?: string;
  quote?: string;
  body?: string;
}

export function AboutSection({ tag, quote, body }: AboutSectionProps) {
  return (
    <section className="px-5 py-10 md:py-16 bg-cream-soft">
      <div className="max-w-screen-xl mx-auto md:grid md:grid-cols-2 md:gap-16 md:items-start">
        {/* Quote */}
        <div>
          {tag && (
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-gold mb-4">{tag}</p>
          )}
          {quote && (
            <blockquote className="border-l-2 border-sage pl-4">
              <p className="font-display font-300 italic text-lg md:text-2xl lg:text-3xl text-sage-deep leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
            </blockquote>
          )}
        </div>

        {/* Corpo */}
        {body && (
          <div className="mt-5 md:mt-6">
            <p className="font-body font-300 text-sm leading-relaxed text-terracotta">{body}</p>
          </div>
        )}
      </div>
    </section>
  );
}
