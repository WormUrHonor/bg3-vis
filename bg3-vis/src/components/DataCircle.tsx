export default function DataCircle() {
  const size = 500;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ border: "1px solid #ccc" }}>
      <circle cx={center} cy={center} r={40} fill="#d4af37" />
      <circle cx={center} cy={center} r={90} fill="none" stroke="#888" strokeWidth={20} />
      <circle cx={center} cy={center} r={130} fill="none" stroke="#aaa" strokeWidth={20} />
    </svg>
  );
}