export default function Icon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  return (
    <span style={{ fontSize: size }} className="inline-block select-none">
      {symbol}
    </span>
  );
}
