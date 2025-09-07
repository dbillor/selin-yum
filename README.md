
# Selin • Baby Log (offline-first)
Beautiful, simple, and evidence-informed baby feeding / diaper / sleep / growth tracker for web. Optimized for one-handed mobile use and deployable on Vercel or any static host.

**Default profile:** Selin Billor — born 2025-09-04 23:53.

## Features
- **Feeding log** (breast/bottle/formula), sides & duration or mL/oz.
- **Diapers** (wet/dirty/mixed) with first-week targets that adapt by day of life.
- **Sleep** sessions with notes.
- **Growth** (weight, length, head) with trend charts.
- **Dashboard** with age, daily counts, and science-backed tips.
- **Offline-first PWA**: install to home screen. Diapers/Sleep/Growth default to local (IndexedDB). Feedings are saved to the backend API.
- **Export/Import JSON** for backups or device transfer.
- **No server required**. Privacy-friendly by default.

## Quick start
```bash
# 1) Ensure Node 18+ is installed
# 2) Install deps
npm install

# 3) Run the API (persists to server/data/db.json)
npm run server

# 4) In a second terminal, run the app
npm run dev

# 5) Deploy to Vercel
#    - Push this folder to a GitHub repo
#    - Import the repo in Vercel (Framework: "Vite")
#    - Build command: npm run build
#    - Output dir: dist
```
You can also host on Netlify, GitHub Pages, Cloudflare Pages, etc.

## Design choices
- Client-side React (Vite + TypeScript + Tailwind), with a tiny built-in backend for persistence where needed.
- PWA with a tiny service worker and manifest for offline use.
- Evidence-informed defaults and helper text from AAP/CDC/WHO.
- Conservative scope: trend charts (not percentiles) to avoid embedding large WHO LMS datasets; link to official charts instead.

## Evidence summary (short)
- **Breastfeeding frequency**: most newborns feed 8–12 times per 24h in early weeks (AAP).  
- **Formula amounts**: in the first days, offer ~1–2 oz every 2–3 hours; most formula-fed newborns feed 8–12 times/24h (CDC).  
- **Vitamin D**: 400 IU/day for breastfed or partially breastfed infants starting soon after birth; formula-fed infants generally do not need supplements if taking adequate formula (CDC/NIH ODS summarizing AAP).  
- **Diapers**: minimum wet diapers typically increase by day: ≥1 (day 1), ≥2 (day 2), ≥3 (day 3), ≥4 (day 4), and ≥6/day by day 5+ (AAP/HealthyChildren).  
- **Safe sleep**: place baby on back for every sleep; use firm, flat sleep surface; keep sleep area bare; room-share (not bed-share) (AAP 2022 policy and 2025 page).  
- **Sleep duration**: newborns commonly sleep around 14–17 hours across 24h, often in 1–3 hour bouts (AAP/NSF).  
- **Immunizations**: follow CDC 2025 child immunization schedule (birth HepB, etc.).  
- **Formula safety/Cronobacter**: follow CDC/FDA prep & storage guidance; for high-risk newborns, consider extra precautions (boiled water, sterile equipment).

## References
- AAP Safe Sleep hub (last updated 2025-07-07)  
  https://www.aap.org/en/patient-care/safe-sleep/
- AAP Policy: Sleep-Related Infant Deaths: Updated 2022 Recommendations  
  https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304
- AAP: Newborn & Infant Breastfeeding (8–12 feeds/day)  
  https://www.aap.org/en/patient-care/newborn-and-infant-nutrition/newborn-and-infant-breastfeeding/
- CDC: How Much & How Often to Feed Infant Formula (1–2 oz q2–3h in first days)  
  https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html
- CDC: Vitamin D (400 IU/day <12 months)  
  https://www.cdc.gov/infant-toddler-nutrition/vitamins-minerals/vitamin-d.html
- NIH ODS: Vitamin D Fact Sheet (AAP 400 IU guidance)  
  https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/
- HealthyChildren (AAP): How Often & How Much; diaper expectations by day 4–5+  
  https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/how-often-and-how-much-should-your-baby-eat.aspx
- HealthyChildren (AAP): How to Tell if Baby is Getting Enough Milk (≥6 wets by 5–7 days)  
  https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/How-to-Tell-if-Baby-is-Getting-Enough-Milk.aspx
- CDC: Formula Preparation & Cronobacter prevention  
  https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html
- WHO Growth Standards (0–2 years)  
  https://www.cdc.gov/growthcharts/who-growth-charts.htm

> This app is information-only and not a substitute for medical care. Always follow your pediatric care team's advice.
