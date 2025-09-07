
export function StatPill({ label, value, sub }:{label:string; value:string|number; sub?:string}){
  return (
    <div className="px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )
}
