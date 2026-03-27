export default function AboutPage() {
  const cardClassName = "group relative mb-14 bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(255,77,77,0.2)] dark:hover:shadow-[0_0_20px_rgba(255,77,77,0.15)] transition-all duration-300 overflow-hidden";
  const glowClassName = "absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-red-500/10 dark:bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 dark:group-hover:bg-red-500/20 transition-all duration-500 pointer-events-none";

  return (
    <div className="min-h-screen bg-bg text-text py-16 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-red-400 dark:via-red-500 dark:to-orange-400">
          About InfraCharge
        </h1>

        {/* Mission Section */}
        <section className={cardClassName}>
          <div className={glowClassName} />
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-red-500 dark:text-red-400 mb-4">
              Our Mission
            </h2>
            <p className="text-muted leading-relaxed text-lg">
              InfraCharge empowers India’s transition to smart and clean mobility by
              making EV charging simple, reliable, and data-driven.
              We exist to provide EV owners with a powerful, precise, and
              user-friendly platform for locating chargers, planning trips,
              estimating range, and staying informed about real-time conditions.
            </p>
          </div>
        </section>

        {/* Vision Section */}
        <section className={cardClassName}>
          <div className={glowClassName} />
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-red-500 dark:text-red-400 mb-4">
              Our Vision
            </h2>
            <p className="text-muted leading-relaxed text-lg">
              To build a future where every EV journey is effortless—powered by
              smart technology, clean energy insights, real-time data, and
              nationwide accessibility.
            </p>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className={cardClassName}>
          <div className={glowClassName} />
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-red-500 dark:text-red-400 mb-6">
              Why Choose InfraCharge?
            </h2>

            <ul className="space-y-4 text-muted text-lg">
              <li>• All-in-one EV toolkit</li>
              <li>• Precise charger discovery based on real-time data</li>
              <li>• Smart trip planning & range prediction</li>
              <li>• Weather-aware battery recommendations</li>
              <li>• Amenities-based route suggestions</li>
              <li>• Optimized cost & charging time estimates</li>
              <li>• Clean, modern UI designed for Indian EV users</li>
              <li>• Nationwide coverage with accurate OCM data</li>
              <li>• Privacy-first design (No tracking, no ads)</li>
            </ul>
          </div>
        </section>

        {/* Unique Features */}
        <section className={`${cardClassName} !mb-20`}>
          <div className={glowClassName} />
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold text-red-500 dark:text-red-400 mb-6">
              What Makes Us Different?
            </h2>

            <div className="grid md:grid-cols-2 gap-8 text-muted">
              <div>
                <h3 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-2">
                  Intelligent Location Scoring
                </h3>
                <p>
                  We analyze safety, traffic, amenities, accessibility, and
                  station performance to help users pick the best charging spot.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-2">
                  Weather-Based EV Insights
                </h3>
                <p>
                  Weather impacts EV range—our system adjusts predictions based on
                  temperature and climate conditions.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-2">
                  Smart Trip Planner
                </h3>
                <p>
                  Plan long journeys with optimized charging stops, route
                  recommendations, and real-time traffic considerations.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-2">
                  Designed for Every EV User
                </h3>
                <p>
                  Whether you're a beginner or expert, InfraCharge adapts to your
                  driving and charging habits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final Message */}
        <section className="text-center relative">
          <h2 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-4">
            Driving the Future of EV Mobility
          </h2>
          <p className="text-muted text-lg leading-relaxed max-w-3xl mx-auto">
            We're committed to creating an India where EV charging is fast,
            accessible, and stress-free.
            Join us on this journey towards a greener and more intelligent
            future.
          </p>
        </section>

      </div>
    </div>
  );
}
