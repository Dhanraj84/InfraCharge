const features = [
  { title: "Smart EV Route Planner", desc: "Real-time traffic, weather, battery usage & charging stops." },
  { title: "Nearest Charging Station Finder", desc: "Live details, station type, amenities, and distance." },
  { title: "Cost & Energy Calculator", desc: "Charging cost, energy, time, and fuel savings." },
  { title: "EV Station Site Analyzer", desc: "Traffic, population, charger gaps & amenities into a score." },
  { title: "Weather-Aware Efficiency", desc: "Heat/cold/rain impacts on range & performance." },
  { title: "Live Traffic Integration", desc: "Avoid slow routes & predict battery usage better." },
  { title: "Select Your EV Model", desc: "Load specs or enter manually if not listed." },
  { title: "Custom EV Support", desc: "Manual entry adjusts all tools automatically." },
  { title: "EV Insights & Analytics", desc: "Energy, CO₂ savings, adoption data & stats." },
];

export default function Features() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map(f => (
        <div key={f.title} className="card hover:shadow-glowBlue dark:hover:shadow-glowGreen transition">
          <h3 className="font-bold text-lg">{f.title}</h3>
          <p className="opacity-90 mt-2">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
