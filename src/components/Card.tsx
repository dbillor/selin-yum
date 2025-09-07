
export default function Card({ title, children, actions }:{title:string; children:any; actions?:any}){
  return (
    <section className="rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}
