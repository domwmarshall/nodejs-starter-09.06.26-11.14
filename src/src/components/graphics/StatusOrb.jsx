export function StatusOrb({ colour = '#2563eb', children }) {
  return (
    <span
      className="status-orb"
      style={{
        '--orb-colour': colour,
      }}
    >
      {children}
    </span>
  );
}
