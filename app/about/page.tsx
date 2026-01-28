export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-text py-16 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <h1 className="text-4xl font-bold text-primary text-center mb-10">
          About InfraCharge
        </h1>

        {/* Mission Section */}
        <section className="mb-14 bg-card border border-border p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Our Mission
          </h2>
          <p className="text-text leading-relaxed text-lg">
            InfraCharge empowers India’s transition to smart and clean mobility by
            making EV charging simple, reliable, and data-driven.
            We exist to provide EV owners with a powerful, precise, and
            user-friendly platform for locating chargers, planning trips,
            estimating range, and staying informed about real-time conditions.
          </p>
        </section>

        {/* Vision Section */}
        <section className="mb-14 bg-card border border-border p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Our Vision
          </h2>
          <p className="text-text leading-relaxed text-lg">
            To build a future where every EV journey is effortless—powered by
            smart technology, clean energy insights, real-time data, and
            nationwide accessibility.
          </p>
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-14 bg-card border border-border p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Why Choose InfraCharge?
          </h2>

          <ul className="space-y-4 text-text text-lg">
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
        </section>

        {/* Unique Features */}
        <section className="mb-20 bg-card border border-border p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            What Makes Us Different?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 text-text">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                Intelligent Location Scoring
              </h3>
              <p>
                We analyze safety, traffic, amenities, accessibility, and
                station performance to help users pick the best charging spot.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                Weather-Based EV Insights
              </h3>
              <p>
                Weather impacts EV range—our system adjusts predictions based on
                temperature and climate conditions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                Smart Trip Planner
              </h3>
              <p>
                Plan long journeys with optimized charging stops, route
                recommendations, and real-time traffic considerations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                Designed for Every EV User
              </h3>
              <p>
                Whether you're a beginner or expert, InfraCharge adapts to your
                driving and charging habits.
              </p>
            </div>
          </div>
        </section>

        {/* Final Message */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Driving the Future of EV Mobility
          </h2>
          <p className="text-text text-lg leading-relaxed max-w-3xl mx-auto">
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
