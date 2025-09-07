
import Card from '../components/Card'

export default function ResourcesPage(){
  return (
    <div className="grid gap-4">
      <Card title="Feeding – evidence at a glance">
        <ul className="list-disc pl-5 text-sm space-y-2">
          <li>Breastfeeding: most newborns nurse 8–12 times in 24 hours in the early weeks. Feed on demand and watch baby’s cues.</li>
          <li>Formula: in the first days, offer ~30–60 mL (1–2 oz) every 2–3 hours; increase gradually as cues indicate.</li>
          <li>Vitamin D: if breastfed (exclusively or partially), give 400 IU vitamin D daily starting in the first days unless your clinician advises otherwise.</li>
          <li>Diapers: by day 5–7, expect ≥6 wet diapers/day and several loose yellow stools.</li>
        </ul>
        <p className="text-xs text-gray-500 mt-2">Primary sources: American Academy of Pediatrics (AAP) & CDC. See the links below.</p>
      </Card>

      <Card title="Safe sleep – essentials">
        <ul className="list-disc pl-5 text-sm space-y-2">
          <li>Always place baby on the back for every sleep.</li>
          <li>Use a firm, flat surface (crib/bassinet/play yard) with a fitted sheet. No pillows, blankets, bumpers, or soft objects.</li>
          <li>Room-share (same room, separate surface) for at least the first 6 months; do not bed-share.</li>
          <li>Avoid overheating; keep head and face uncovered.</li>
        </ul>
      </Card>

      <Card title="When to call your clinician (non-exhaustive)">
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Any rectal temperature of ≥100.4°F (38°C) in a baby under 3 months.</li>
          <li>Fewer wet diapers than expected, poor feeding, lethargy, or worsening jaundice.</li>
        </ul>
      </Card>

      <Card title="Authoritative links">
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><a className="link" href="https://www.aap.org/en/patient-care/safe-sleep/" target="_blank">AAP: Safe Sleep</a></li>
          <li><a className="link" href="https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html" target="_blank">CDC: How much & how often (formula)</a></li>
          <li><a className="link" href="https://www.cdc.gov/infant-toddler-nutrition/vitamins-minerals/vitamin-d.html" target="_blank">CDC: Vitamin D</a></li>
          <li><a className="link" href="https://www.aap.org/en/patient-care/newborn-and-infant-nutrition/newborn-and-infant-breastfeeding/" target="_blank">AAP: Breastfeeding the Newborn</a></li>
          <li><a className="link" href="https://www.cdc.gov/vaccines/hcp/imz-schedules/index.html" target="_blank">CDC: 2025 Child Immunization Schedule</a></li>
          <li><a className="link" href="https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html" target="_blank">CDC: Preparing Formula & Cronobacter</a></li>
          <li><a className="link" href="https://www.cdc.gov/growthcharts/who-growth-charts.htm" target="_blank">WHO Growth Standards (US use)</a></li>
        </ul>
      </Card>

      <p className="text-xs text-gray-500">This app does not provide medical diagnosis or treatment. Always follow your pediatric care team's advice.</p>
    </div>
  )
}
