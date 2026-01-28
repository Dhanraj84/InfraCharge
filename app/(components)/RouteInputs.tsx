"use client";

export default function RouteInputs({
  src,
  dst,
  setSrc,
  setDst,
  onSubmit
}: {
  src: string;
  dst: string;
  setSrc: (v: string) => void;
  setDst: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="card grid sm:grid-cols-[1fr_1fr_auto] gap-3">

      <input
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        className="p-3 rounded-xl bg-transparent border border-white/20"
        placeholder="Source (GPS auto)"
      />

      <input
        value={dst}
        onChange={(e) => setDst(e.target.value)}
        className="p-3 rounded-xl bg-transparent border border-white/20"
        placeholder="Destination"
      />

      <button className="btn btn-primary" onClick={onSubmit}>
        Plan Route
      </button>

    </div>
  );
}
