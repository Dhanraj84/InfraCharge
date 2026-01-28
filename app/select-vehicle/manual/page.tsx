export default function ManualVehicle() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Enter Your EV Details</h1>
      <form className="space-y-3">
        <input className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Vehicle Name" />
        <input type="number" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Battery Capacity (kWh)" />
        <input type="number" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Range (km)" />
        <input type="number" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Charging Power (kW)" />
        <input type="number" className="w-full p-3 rounded-xl border border-white/20 bg-transparent" placeholder="Fast Charging Time (min)" />
        <select className="w-full p-3 rounded-xl border border-white/20 bg-transparent">
          <option>2W</option><option>3W</option><option>4W</option>
        </select>
        <div className="flex items-center gap-3">
          <a href="/select-vehicle" className="btn btn-outline">← Back</a>
          <button className="btn btn-primary">Save & Continue</button>
        </div>
      </form>
    </div>
  );
}
