import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-20">

      {/* ================= HERO ================= */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-text">
          Powering India’s Electric Future
        </h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto text-muted">
          Smart tools for EV owners, businesses, and planners.
        </p>
      </section>

      {/* ========== JOURNEY OF INNOVATION ========= */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-text">
            Our Journey of Innovation
          </h2>
          <p className="text-muted">
            From smart route planning to real-time EV analytics, InfraCharge is shaping the future
            of electric mobility with data-driven insights, intelligent tools, and a commitment to
            sustainable innovation.
          </p>
        </div>

        <div className="relative bg-card border border-border rounded-3xl p-2">
          <Image
            src="/timeline.png"
            width={1200}
            height={700}
            alt="Timeline"
            className="rounded-2xl"
          />
        </div>
      </section>

      {/* ========== ROUTE PLANNER CTA ========= */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-text">
            Plan intelligent EV routes
          </h3>
          <p className="text-muted">
            Live traffic, weather, battery usage, charging stops & savings.
          </p>
          <Link href="/route-planner" className="btn btn-primary w-fit">
            Let’s Go →
          </Link>
        </div>

        <video
          className="rounded-2xl bg-card border border-border"
          src="/route.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>

    {/* ========== WHERE TO BUILD ========= */}
<section className="grid md:grid-cols-2 gap-10 items-center">
  <div className="space-y-4">
    <h3 className="text-2xl font-bold text-text">
      Where to build EV stations
    </h3>
    <p className="text-muted">
      Analyze demand, traffic, charger gaps & amenities to pick the right spot.
    </p>
    <Link href="/where-to-build" className="btn btn-primary w-fit">
      Let's Go →
    </Link>
  </div>

  <div className="bg-card border border-border rounded-2xl p-2 overflow-hidden">
    <video
      src="/build-ev.mp4"
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full rounded-xl object-cover"
    />
  </div>
</section>


      {/* ========== FIND NEAREST ========= */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-text">
            Find nearest charging station
          </h3>
          <p className="text-muted">
            Auto-detect your location, filter by connector, price & amenities.
          </p>
          <Link href="/find-charging" className="btn btn-primary w-fit">
            Let’s Go →
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-2">
        <video
      src="/Nearest.mp4"
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full rounded-xl object-cover"
    />
        </div>
      </section>

      {/* ========== CO2 SAVINGS ========= */}
      <section className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-text">
          Your CO₂ Savings
        </h3>
        <p className="text-muted">
          See how much carbon & money you save by going electric.
        </p>
        <Link href="/co2-savings" className="btn btn-primary">
          Calculate Now →
        </Link>
      </section>

    </div>
  );
}
