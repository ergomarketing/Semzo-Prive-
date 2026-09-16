export type PublicReview = {
  id: string
  rating: number
  comment: string | null
  display_name: string | null
  last_initial: string | null
  bag_name: string | null
  bag_brand: string | null
}

// Solo se renderiza si hay reseñas: son 100% reales (rating>7 y consentimiento
// explícito de la socia), nunca placeholders. Sin reseñas, la sección no existe.
export default function VerifiedReviewsSection({ reviews }: { reviews: PublicReview[] }) {
  if (!reviews || reviews.length === 0) return null

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-indigo-dark mb-3 font-medium">Reseñas verificadas</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-slate-900 leading-tight">
            Lo que dicen nuestras socias
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((review) => (
            <article key={review.id} className="bg-rose-nude/10 rounded-lg p-6 border border-rose-pastel/30">
              <div className="flex items-center gap-1 mb-3" aria-label={`Puntuación ${review.rating} de 10`}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-3 rounded-full ${i < review.rating ? "bg-indigo-dark" : "bg-slate-200"}`}
                  />
                ))}
              </div>
              {review.comment && (
                <blockquote className="font-serif text-base text-slate-900 italic mb-4 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
              )}
              <div className="text-sm">
                <span className="font-medium text-indigo-dark">
                  {review.display_name}
                  {review.last_initial ? ` ${review.last_initial}.` : ""}
                </span>
                {review.bag_brand && review.bag_name && (
                  <span className="text-slate-500">
                    {" "}
                    · {review.bag_brand} {review.bag_name}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
