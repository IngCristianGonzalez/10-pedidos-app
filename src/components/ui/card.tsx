export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-b border-black/[0.06] ${className}`}>{children}</div>;
}
export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
