import React, { useState, useMemo } from "react";
import { ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";

// ---------- Brand tokens ----------
const C = {
  burgundy: "#7C2230",
  burgundyDark: "#571521",
  ink: "#22262B",
  paper: "#FAF8F5",
  card: "#FFFFFF",
  line: "#E5E0D8",
  mute: "#6B7076",
  active: "#2F6DB3",
  pending: "#B98A2F",
  sold: "#2E7D4F",
  expired: "#8A8F98",
};
const serif = "Georgia, 'Times New Roman', serif";
const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// ---------- Formatting ----------
const fmt$ = (n, dec = 0) => {
  if (n === "" || n === null || n === undefined || isNaN(n)) return "—";
  const v = Number(n);
  const s = "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return v < 0 ? `(${s})` : s;
};
const fmtN = (n) => (n === "" || n === null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US"));
const num = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// ---------- Sample deal data (fictional demo — replace via the form) ----------
const SUBJECT_DEFAULT = {
  owners: "Sample Client",
  address: "118 Magnolia Ridge Court, Lexington, SC 29072",
  beds: 3, baths: 2, sqft: 1625, yearBuilt: 1985, lot: 0.26, garage: 2,
  condition: "Sample property — illustrative figures only.",
  payoff: 150000, taxes: 1700, insurance: 1500, hoa: 500,
  closeDate: "",
};

let _id = 100;
const mk = (o) => ({ id: ++_id, soldPrice: "", closeDate: "", notes: "", ...o });

const COMPS_DEFAULT = [
  // Sample comps — fictional addresses, illustrative figures.
  mk({ cat: "active", address: "1 Oakleaf Court", listPrice: 325000, beds: 3, baths: 2, sqft: 2200, yearBuilt: 1981, dom: 19, notes: "Fully renovated: granite, new appliances, new deck & fence. Recently reduced." }),
  mk({ cat: "active", address: "2 Cedar Bend Lane", listPrice: 319900, beds: 4, baths: 2.5, sqft: 1887, yearBuilt: 1983, dom: 57, notes: "Formal LR + great room, renovated hall bath, new LVP." }),
  mk({ cat: "active", address: "3 Southpine Way", listPrice: 232000, beds: 3, baths: 2, sqft: 1316, yearBuilt: 1979, dom: 335, notes: "All-brick ranch on cul-de-sac. Started high and has been sitting since." }),
  mk({ cat: "pending", address: "4 Baymore Trace", listPrice: 231100, beds: 3, baths: 2, sqft: 1556, yearBuilt: 1970, dom: 229, notes: "Under contract after 229 days — the cost of an optimistic list price." }),
  mk({ cat: "sold", address: "5 Tawny Branch Court", listPrice: 275000, soldPrice: 275000, beds: 3, baths: 2, sqft: 1700, yearBuilt: 1978, dom: 62, notes: "0.40 ac, 2-car garage. Closest comparable by size." }),
  mk({ cat: "sold", address: "6 Shadowpine Road", listPrice: 265000, soldPrice: 265000, beds: 3, baths: 2, sqft: 1710, yearBuilt: 1977, dom: 25, notes: "2-car garage. Sold quickly at a fair price." }),
  mk({ cat: "sold", address: "7 Forest Fern Road", listPrice: 249900, soldPrice: 249900, beds: 4, baths: 2.5, sqft: 1887, yearBuilt: 1978, dom: 28, notes: "0.27 ac, 2-car garage. Most recent sale in the set." }),
  mk({ cat: "sold", address: "8 Colony House Court", listPrice: 235000, soldPrice: 235000, beds: 3, baths: 2, sqft: 1484, yearBuilt: 1998, dom: 27, notes: "0.16 ac, 1-car garage. Newer build, smaller footprint." }),
  mk({ cat: "expired", address: "9 Lakefront Drive", listPrice: 437000, origPrice: 458850, beds: 4, baths: 2, sqft: 1985, yearBuilt: 2023, dom: 153, notes: "One small cut in 153 days — still well above market. Buyers never bit." }),
  mk({ cat: "expired", address: "10 Timbertrail Court", listPrice: 410000, origPrice: 410000, beds: 4, baths: 2, sqft: 2700, yearBuilt: 1985, dom: 166, notes: "Zero price movement in 166 days — the market moved on without it." }),
];

const ADJ_FIELDS = ["sqft", "beds", "baths", "garage", "condition", "lot", "upgrades"];
const ADJ_LABELS = { sqft: "SqFt", beds: "Beds", baths: "Baths", garage: "Garage", condition: "Condition", lot: "Lot", upgrades: "Upgrades" };

const FEES_DEFAULT = {
  deedStampRate: 0.0037, deedPrep: 500, cl100: 0,
  sellerPct: 3, buyerPct: 3, warranty: 0, misc: 0,
  renovations: 0, repairs: 0, specialAssessments: 0, outOfStatePct: 0,
};

const TIERS_DEFAULT = { bottom: 250000, happy: 260000, best: 275000 };

// ---------- Market report data (editable via Quick CMA Form) ----------
// Defaults: 99 closed SFH sales, zip 29212, Jul 2024 – Jul 2026 (Paragon MLS)
const MARKET_DEFAULT = {
  title: "Zip 29212 — Single-Family Sales, Last 24 Months",
  subtitle: "99 closed sales · July 2024 – July 2026 · Irmo / St. Andrews / Harbison corridor",
  caveat: "Shared MLS reports cap at 100 listings, so check whether your export captured the full price range for the zip before relying on the medians.",
  link: "",
  kpis: [
    { label: "Sales analyzed", value: "99", sub: "Jul 2024 – Jul 2026" },
    { label: "Median sold price", value: "$188,000", sub: "this segment" },
    { label: "Median $/SqFt", value: "$138", sub: "sold price basis" },
    { label: "Median days on market", value: "20.5", sub: "avg 38.7" },
    { label: "Sold-to-list ratio", value: "96.5%", sub: "93.2% of original ask" },
    { label: "Took a price cut", value: "41%", sub: "before selling" },
  ],
  trend: [
    { q: "'24 Q3", medPrice: 184388, medPsf: 131 }, { q: "'24 Q4", medPrice: 192500, medPsf: 141 },
    { q: "'25 Q1", medPrice: 194500, medPsf: 137 }, { q: "'25 Q2", medPrice: 188000, medPsf: 141 },
    { q: "'25 Q3", medPrice: 170000, medPsf: 133 }, { q: "'25 Q4", medPrice: 187000, medPsf: 141 },
    { q: "'26 Q1", medPrice: 183500, medPsf: 136 }, { q: "'26 Q2", medPrice: 195000, medPsf: 157 },
    { q: "'26 Q3*", medPrice: 173500, medPsf: 110 },
  ],
  timeMoney: [
    { band: "0–5", pct: 96.5, n: 31 }, { band: "6–10", pct: 96.2, n: 10 }, { band: "11–20", pct: 97.8, n: 8 },
    { band: "21–30", pct: 88.1, n: 4 }, { band: "31–45", pct: 90.6, n: 12 }, { band: "46–99", pct: 91.0, n: 23 },
    { band: "100+", pct: 86.9, n: 11 },
  ],
  cut: { rightN: 58, cutN: 41, rightDom: 5, cutDom: 59, rightPct: 97.0, cutPct: 87.8, avgLoss: 26580 },
  size: [
    { band: "< 1,200", psf: 158, n: 23 }, { band: "1,200–1,599", psf: 142, n: 52 },
    { band: "1,600–1,999", psf: 101, n: 11 }, { band: "2,000+", psf: 77, n: 13 },
  ],
  want: [
    "Priced right on day one. 58 of 99 homes never cut price — they sold in a median of 5 days at 97% of ask.",
    "3+ bedrooms. 92 of 99 sales had 3+ beds; 4-bedroom homes moved fastest of all (median 8 days).",
    "The $175K–$200K sweet spot was the deepest, fastest pocket here (30 sales, 13.5-day median) — ShowingTime data shows the $250K–$300K brackets carry 77% of current buyer traffic.",
    "Move-in-ready sells itself. A third of all sales (31) went under contract within 5 days.",
  ],
  dontWant: [
    "Aspirational pricing. 95% of homes that sat 60+ days ended up cutting price — and still settled for only 88% of original ask.",
    "Chasing the market down. Price-cutters averaged a $26,580 haircut and a 59-day median wait.",
    "The 21-day cliff. Once a listing crossed three weeks, negotiating leverage collapsed (from ~97% of ask to 87–91%).",
    "2-bedroom layouts lagged the market (39-day median) — limited buyer pool at any price.",
  ],
};
const MARKET_BLANK = {
  ...MARKET_DEFAULT,
  title: "Market Snapshot", subtitle: "", caveat: "", link: "",
  kpis: MARKET_DEFAULT.kpis.map((k) => ({ ...k, value: "", sub: "" })),
  trend: [], timeMoney: MARKET_DEFAULT.timeMoney.map((t) => ({ ...t, pct: "", n: "" })),
  cut: { rightN: "", cutN: "", rightDom: "", cutDom: "", rightPct: "", cutPct: "", avgLoss: "" },
  size: [], want: [], dontWant: [],
};

// Paragon CollabLink report URLs — paste per deal via the form.
// Left blank on purpose: live MLS share links must not be committed to a public repo.
const LINKS_DEFAULT = {
  active: "",
  pending: "",
  sold: "",
  expired: "",
};

// ShowingTime Target Market Analysis, zip 29212, 3+ beds, 6/29–7/29/2026
const BUYER_BRACKETS = [
  { label: "$250,000 – $274,999", showings: 41, pct: 29.71 },
  { label: "$275,000 – $299,999", showings: 65, pct: 47.10 },
  { label: "$300,000 – $324,999", showings: 17, pct: 12.32 },
  { label: "$325,000+", showings: 15, pct: 10.87 },
];

// List-to-sale % by days on market (SVR pricing strategy)
const TIME_MONEY = [
  { band: "0–5", pct: 99 }, { band: "6–10", pct: 99 }, { band: "11–20", pct: 99 },
  { band: "21–30", pct: 96 }, { band: "31–45", pct: 94 }, { band: "46–99", pct: 95 }, { band: "100+", pct: 95 },
];

const CAT_META = {
  active: { title: "The Competition", sub: "Active listings buyers see next to yours", color: C.active, tag: "ACTIVE" },
  pending: { title: "Pendings", sub: "Under contract — where the market is agreeing on price", color: C.pending, tag: "PENDING" },
  sold: { title: "Solds", sub: "Closed sales — what buyers actually paid", color: C.sold, tag: "SOLD" },
  expired: { title: "What Buyers Didn't Want", sub: "Expired / removed in the last 90 days", color: C.expired, tag: "EXPIRED" },
};

// ---------- Small building blocks ----------
const Label = ({ children }) => (
  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.mute, fontFamily: sans }}>{children}</label>
);
const Input = ({ value, onChange, type = "text", w = "" }) => (
  <input
    type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
    className={`border rounded px-2 py-1.5 text-sm w-full ${w}`}
    style={{ borderColor: C.line, fontFamily: sans, color: C.ink, background: "#fff" }}
  />
);
const Field = ({ label, ...p }) => (<div><Label>{label}</Label><Input {...p} /></div>);

const SectionTitle = ({ kicker, title, sub, color = C.burgundy }) => (
  <div className="mb-4">
    {kicker && <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color, fontFamily: sans }}>{kicker}</div>}
    <h2 className="text-2xl" style={{ fontFamily: serif, color: C.ink }}>{title}</h2>
    {sub && <p className="text-sm mt-1" style={{ color: C.mute }}>{sub}</p>}
  </div>
);

const Tag = ({ color, children }) => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>{children}</span>
);

// ---------- Main component ----------
export default function SvrCmaTool() {
  const [subject, setSubject] = useState(SUBJECT_DEFAULT);
  const [comps, setComps] = useState(COMPS_DEFAULT);
  const [adjs, setAdjs] = useState({}); // {compId: {sqft:0,...}}
  const [fees, setFees] = useState(FEES_DEFAULT);
  const [tiers, setTiers] = useState(TIERS_DEFAULT);
  const [clientView, setClientView] = useState(false);
  const [sqftRate, setSqftRate] = useState(40);
  const [links, setLinks] = useState(LINKS_DEFAULT);
  const setLink = (cat, v) => setLinks((l) => ({ ...l, [cat]: v }));
  const [market, setMarket] = useState(MARKET_DEFAULT);
  const setMkt = (k) => (v) => setMarket((m) => ({ ...m, [k]: v }));
  const setMktKpi = (i, k, v) => setMarket((m) => ({ ...m, kpis: m.kpis.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const setMktRow = (arr, i, k, v) => setMarket((m) => ({ ...m, [arr]: m[arr].map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const addMktRow = (arr, row) => setMarket((m) => ({ ...m, [arr]: [...m[arr], row] }));
  const delMktRow = (arr, i) => setMarket((m) => ({ ...m, [arr]: m[arr].filter((_, j) => j !== i) }));
  const setMktCut = (k, v) => setMarket((m) => ({ ...m, cut: { ...m.cut, [k]: v } }));
  const [bulkCat, setBulkCat] = useState("active");
  const [bulkText, setBulkText] = useState("");

  const bulkAdd = () => {
    const rows = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const added = rows.map((line) => {
      const p = line.split(/\t|\|/).map((x) => x.trim());
      const isSoldRow = bulkCat === "sold";
      return mk({
        cat: bulkCat,
        address: p[0] || "",
        listPrice: p[1] ? Number(p[1].replace(/[$,]/g, "")) : "",
        soldPrice: isSoldRow && p[2] ? Number(p[2].replace(/[$,]/g, "")) : "",
        beds: p[isSoldRow ? 3 : 2] || "", baths: p[isSoldRow ? 4 : 3] || "",
        sqft: p[isSoldRow ? 5 : 4] ? Number(String(p[isSoldRow ? 5 : 4]).replace(/,/g, "")) : "",
        yearBuilt: p[isSoldRow ? 6 : 5] || "", dom: p[isSoldRow ? 7 : 6] || "",
        notes: p[isSoldRow ? 8 : 7] || "",
      });
    });
    if (added.length) { setComps((cs) => [...cs, ...added]); setBulkText(""); }
  };

  const setSub = (k) => (v) => setSubject((s) => ({ ...s, [k]: v }));
  const setFee = (k) => (v) => setFees((f) => ({ ...f, [k]: v }));
  const setTier = (k) => (v) => setTiers((t) => ({ ...t, [k]: v }));

  const updateComp = (id, k, v) => setComps((cs) => cs.map((c) => (c.id === id ? { ...c, [k]: v } : c)));
  const removeComp = (id) => setComps((cs) => cs.filter((c) => c.id !== id));
  const addComp = (cat) => setComps((cs) => [...cs, mk({ cat, address: "", listPrice: "", beds: "", baths: "", sqft: "", yearBuilt: "", dom: "" })]);

  const getAdj = (id) => adjs[id] || {};
  const setAdj = (id, k, v) => setAdjs((a) => ({ ...a, [id]: { ...(a[id] || {}), [k]: v } }));
  const adjTotal = (id) => ADJ_FIELDS.reduce((s, k) => s + num(getAdj(id)[k]), 0);

  const loadDemo = () => { setSubject(SUBJECT_DEFAULT); setComps(COMPS_DEFAULT); setAdjs({}); setFees(FEES_DEFAULT); setTiers(TIERS_DEFAULT); setLinks(LINKS_DEFAULT); setMarket(MARKET_DEFAULT); };
  const clearAll = () => {
    setSubject({ owners: "", address: "", beds: "", baths: "", sqft: "", yearBuilt: "", lot: "", garage: "", condition: "", payoff: "", taxes: "", insurance: "", hoa: "", closeDate: "" });
    setComps([]); setAdjs({}); setFees({ ...FEES_DEFAULT, deedPrep: 250, cl100: 175, warranty: 600, misc: 200 }); setTiers({ bottom: "", happy: "", best: "" });
    setLinks({ active: "", pending: "", sold: "", expired: "" });
    setMarket(MARKET_BLANK);
  };

  // ---------- Derived ----------
  const byCat = (cat) => comps.filter((c) => c.cat === cat);
  const psf = (price, sqft) => (num(sqft) > 0 ? num(price) / num(sqft) : 0);
  const compPrice = (c) => (c.cat === "sold" ? num(c.soldPrice || c.listPrice) : num(c.listPrice));

  const solds = byCat("sold");
  const soldPsfs = solds.filter((c) => num(c.sqft) > 0 && compPrice(c) > 0).map((c) => psf(compPrice(c), c.sqft));
  const soldDoms = solds.filter((c) => c.dom !== "").map((c) => num(c.dom));
  const adjValues = solds.map((c) => compPrice(c) + adjTotal(c.id)).filter((v) => v > 0);
  const adjPsfs = solds.filter((c) => num(c.sqft) > 0 && compPrice(c) > 0).map((c) => (compPrice(c) + adjTotal(c.id)) / num(c.sqft));

  const stats = {
    avgPsf: avg(soldPsfs), medPsf: median(soldPsfs),
    avgDom: avg(soldDoms), medDom: median(soldDoms),
    avgAdjPsf: avg(adjPsfs), medAdjPsf: median(adjPsfs),
    medAdjValue: median(adjValues),
    indicated: num(subject.sqft) > 0 ? median(adjPsfs) * num(subject.sqft) : 0,
  };

  const daysToClose = useMemo(() => {
    if (!subject.closeDate) return 0;
    const d = Math.round((new Date(subject.closeDate) - new Date("2026-07-29")) / 86400000);
    return Math.max(d, 0);
  }, [subject.closeDate]);

  const netFor = (price) => {
    const p = num(price);
    const rows = [
      ["Mortgage(s) Payoff", -num(subject.payoff)],
      ["Renovations", -num(fees.renovations)],
      ["Deed Stamps", -p * num(fees.deedStampRate), `${fees.deedStampRate} × price`],
      ["Deed Preparation", -num(fees.deedPrep)],
      ["CL-100 Inspection", -num(fees.cl100)],
      ["Seller Broker Compensation", -(p * num(fees.sellerPct)) / 100, `${fees.sellerPct}%`],
      ["Buyer Broker Compensation", -(p * num(fees.buyerPct)) / 100, `${fees.buyerPct}%`],
      ["Special Assessments", -num(fees.specialAssessments)],
      ["Repairs", -num(fees.repairs)],
      ["Home Warranty", -num(fees.warranty)],
      ["Out-of-State Withholding", -(p * num(fees.outOfStatePct)) / 100, `${fees.outOfStatePct}%`],
      ["Misc Attorney Fees", -num(fees.misc)],
      ["Prorated HOA", -(num(subject.hoa) / 360) * daysToClose, `${daysToClose} days`],
      ["Prorated Taxes (360-day yr)", -(num(subject.taxes) / 360) * daysToClose, `${daysToClose} days`],
      ["Prorated Insurance (360-day yr)", -(num(subject.insurance) / 360) * daysToClose, `${daysToClose} days`],
    ];
    const total = rows.reduce((s, r) => s + r[1], 0);
    return { rows, total, net: p + total };
  };

  const tierList = [
    { key: "bottom", label: "Bottom", desc: "Fast-sale floor" },
    { key: "happy", label: "Happy", desc: "Most likely" },
    { key: "best", label: "Best", desc: "Top of market" },
  ];

  // Bracketing bounds
  const allPrices = comps.map(compPrice).filter((v) => v > 0).concat(tierList.map((t) => num(tiers[t.key])).filter((v) => v > 0));
  const bMin = allPrices.length ? Math.min(...allPrices) * 0.97 : 0;
  const bMax = allPrices.length ? Math.max(...allPrices) * 1.03 : 1;
  const pos = (v) => `${((v - bMin) / (bMax - bMin)) * 100}%`;

  // ---------- Render pieces ----------
  const renderCompTable = (cat) => {
    const list = byCat(cat);
    const meta = CAT_META[cat];
    const isSold = cat === "sold";
    const isExp = cat === "expired";
    return (
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: C.line, background: C.card }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: C.card, borderBottom: `3px solid ${meta.color}` }}>
          <div>
            <div className="flex items-center gap-2">
              <Tag color={meta.color}>{meta.tag}</Tag>
              <span className="font-semibold" style={{ fontFamily: serif, fontSize: 18 }}>{meta.title}</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: C.mute }}>{meta.sub}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {links[cat] && (
              <a href={links[cat]} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded border no-underline"
                style={{ color: meta.color, borderColor: meta.color, background: "#fff" }}>
                {cat === "sold" ? "View full CMA report ↗" : "View live MLS report ↗"}
              </a>
            )}
            {!clientView && (<>
              <input
                value={links[cat]} onChange={(e) => setLink(cat, e.target.value)} placeholder="Paste report link…"
                className="border rounded px-2 py-1.5 text-xs w-44"
                style={{ borderColor: C.line, color: C.mute, background: "#fff" }}
              />
              <button onClick={() => addComp(cat)} className="text-xs font-semibold px-3 py-1.5 rounded text-white" style={{ background: meta.color }}>+ Add comp</button>
            </>)}
          </div>
        </div>
        {list.length === 0 ? (
          <div className="px-4 py-6 text-sm" style={{ color: C.mute }}>No {meta.tag.toLowerCase()} comps entered{cat === "pending" ? " — none currently under contract in this pocket" : ""}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: sans }}>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ color: C.mute }}>
                  {["Address", isExp ? "Orig Price" : null, isExp ? "Final List" : "List Price", isSold ? "Sold Price" : null, isExp ? "Expired" : null, "Bd", "Ba", "Htd SqFt", "Yr", "DOM", "$/SqFt", isSold && !clientView ? "Adj." : null, isSold ? "Adj. Value" : null, "Notes", !clientView ? "" : null]
                    .filter((h) => h !== null)
                    .map((h, i) => (<th key={i} className="px-3 py-2 whitespace-nowrap">{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const price = compPrice(c);
                  const at = adjTotal(c.id);
                  return (
                    <tr key={c.id} className="border-t align-top" style={{ borderColor: C.line }}>
                      <td className="px-3 py-2 min-w-[190px]">{clientView ? c.address : <Input value={c.address} onChange={(v) => updateComp(c.id, "address", v)} />}</td>
                      {isExp && (
                        <td className="px-3 py-2 min-w-[105px]" style={{ color: C.mute }}>
                          {clientView
                            ? <span style={{ textDecoration: num(c.origPrice) > num(c.listPrice) ? "line-through" : "none" }}>{fmt$(c.origPrice)}</span>
                            : <Input type="number" value={c.origPrice} onChange={(v) => updateComp(c.id, "origPrice", v)} />}
                        </td>
                      )}
                      <td className="px-3 py-2 min-w-[105px]">{clientView ? fmt$(c.listPrice) : <Input type="number" value={c.listPrice} onChange={(v) => updateComp(c.id, "listPrice", v)} />}</td>
                      {isSold && <td className="px-3 py-2 min-w-[105px] font-semibold" style={{ color: C.sold }}>{clientView ? fmt$(c.soldPrice) : <Input type="number" value={c.soldPrice} onChange={(v) => updateComp(c.id, "soldPrice", v)} />}</td>}
                      {isExp && <td className="px-3 py-2 min-w-[110px]">{clientView ? (c.expDate || "—") : <Input type="date" value={c.expDate} onChange={(v) => updateComp(c.id, "expDate", v)} />}</td>}
                      <td className="px-3 py-2 min-w-[60px]">{clientView ? c.beds : <Input type="number" value={c.beds} onChange={(v) => updateComp(c.id, "beds", v)} />}</td>
                      <td className="px-3 py-2 min-w-[60px]">{clientView ? c.baths : <Input type="number" value={c.baths} onChange={(v) => updateComp(c.id, "baths", v)} />}</td>
                      <td className="px-3 py-2 min-w-[85px]">{clientView ? fmtN(c.sqft) : <Input type="number" value={c.sqft} onChange={(v) => updateComp(c.id, "sqft", v)} />}</td>
                      <td className="px-3 py-2 min-w-[75px]">{clientView ? c.yearBuilt : <Input type="number" value={c.yearBuilt} onChange={(v) => updateComp(c.id, "yearBuilt", v)} />}</td>
                      <td className="px-3 py-2 min-w-[65px]">{clientView ? c.dom : <Input type="number" value={c.dom} onChange={(v) => updateComp(c.id, "dom", v)} />}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">{num(c.sqft) > 0 && price > 0 ? fmt$(psf(price, c.sqft), 0) : "—"}</td>
                      {isSold && !clientView && (
                        <td className="px-3 py-2 whitespace-nowrap text-xs" style={{ color: at === 0 ? C.mute : C.burgundy }}>{at === 0 ? "0" : fmt$(at)}</td>
                      )}
                      {isSold && <td className="px-3 py-2 whitespace-nowrap font-semibold">{price > 0 ? fmt$(price + at) : "—"}</td>}
                      <td className="px-3 py-2 min-w-[220px] text-xs" style={{ color: C.mute }}>{clientView ? c.notes : <Input value={c.notes} onChange={(v) => updateComp(c.id, "notes", v)} />}</td>
                      {!clientView && (
                        <td className="px-2 py-2"><button onClick={() => removeComp(c.id)} className="text-xs" style={{ color: C.mute }} title="Remove">✕</button></td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {isExp && list.length > 0 && (() => {
              const expPsf = avg(list.filter((c) => num(c.sqft) > 0 && num(c.listPrice) > 0).map((c) => num(c.listPrice) / num(c.sqft)));
              const expDom = avg(list.filter((c) => c.dom !== "").map((c) => num(c.dom)));
              return (
                <div className="mx-4 mb-4 rounded p-3 text-sm" style={{ background: "#F1F1F3", color: C.ink }}>
                  <b>Why buyers passed:</b> these homes asked an average of <b>{fmt$(expPsf, 0)}/sqft</b> and sat <b>{Math.round(expDom)} days</b> without selling, while buyers in this market actually paid <b>{fmt$(stats.avgPsf, 0)}/sqft</b> and closed in a median of <b>{Math.round(stats.medDom)} days</b>. Overpricing doesn't get a higher price — it gets no sale.
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const contactBar = (
    <div className="text-center text-xs leading-relaxed" style={{ color: C.mute, fontFamily: sans }}>
      <div className="font-semibold" style={{ color: C.ink }}>Doug Wilkes, Real Estate Agent &nbsp;|&nbsp; C: 843-364-3346 &nbsp;|&nbsp; dwilkes@svrealty.com</div>
      <div>Office: 803-359-9571 &nbsp;|&nbsp; www.svrealty.com &nbsp;|&nbsp; 955 Old Cherokee Rd, Lexington, SC 29072</div>
    </div>
  );

  const exportReport = () => {
    const node = document.getElementById("svr-report");
    if (!node) return;
    const addr = (subject.address || "CMA_Report").split(",")[0].replace(/[^A-Za-z0-9]+/g, "_");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CMA & Market Report — ${subject.address || ""}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  body { margin: 0; background: #fff; }
  .no-print { display: none !important; }
  @media print { .print-break { page-break-before: always; } }
  svg { max-width: 100%; }
</style>
</head>
<body>
${node.outerHTML}
<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},900)});<\/script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${addr}_CMA_Market_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div id="svr-report" style={{ background: C.paper, minHeight: "100vh", color: C.ink }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { background: #fff !important; }
        }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
      `}</style>

      {/* ===== Header ===== */}
      <header style={{ background: C.burgundy }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase" style={{ letterSpacing: "0.25em", fontFamily: sans, opacity: 0.85 }}>Southern Visions Real Estate</div>
            <h1 className="text-3xl mt-0.5" style={{ fontFamily: serif }}>Comparative Market Analysis &amp; Market Report</h1>
            <div className="text-sm mt-1" style={{ opacity: 0.9, fontStyle: "italic", fontFamily: serif }}>
              "Your Home SOLD for the highest price. NO EXCEPTIONS. NO EXCUSES."
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <button onClick={() => setClientView(!clientView)} className="px-4 py-2 rounded font-semibold text-sm" style={{ background: "#fff", color: C.burgundy }}>
              {clientView ? "← Back to editing" : "Client View"}
            </button>
            {clientView && (
              <button onClick={exportReport} className="px-4 py-2 rounded font-semibold text-sm border border-white/60 text-white">Download printable report</button>
            )}
            {!clientView && (<>
              <button onClick={loadDemo} className="px-3 py-2 rounded text-sm border border-white/50 text-white">Reload sample data</button>
              <button onClick={clearAll} className="px-3 py-2 rounded text-sm border border-white/50 text-white">Clear all</button>
            </>)}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10" style={{ fontFamily: sans }}>

        {/* ===== 1. Subject Property ===== */}
        <section>
          <SectionTitle kicker="Step 1" title="Subject Property" sub={clientView ? undefined : "The home we're pricing"} />
          {clientView ? (
            <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <div className="text-xl" style={{ fontFamily: serif }}>{subject.address || "—"}</div>
                  <div className="text-sm mt-1" style={{ color: C.mute }}>Prepared for {subject.owners || "—"} · July 29, 2026</div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-2 text-sm">
                  {[["Beds", subject.beds], ["Baths", subject.baths], ["Htd SqFt", fmtN(subject.sqft)], ["Built", subject.yearBuilt], ["Lot (ac)", subject.lot], ["Garage", subject.garage]].map(([l, v]) => (
                    <div key={l}><div className="text-[10px] uppercase font-bold" style={{ color: C.mute }}>{l}</div><div className="font-semibold">{v || "—"}</div></div>
                  ))}
                </div>
              </div>
              {subject.condition && <p className="text-sm mt-3" style={{ color: C.mute }}>{subject.condition}</p>}
            </div>
          ) : (
            <div className="rounded-lg border p-5 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ borderColor: C.line, background: C.card }}>
              <div className="col-span-2"><Field label="Homeowner(s)" value={subject.owners} onChange={setSub("owners")} /></div>
              <div className="col-span-2"><Field label="Address" value={subject.address} onChange={setSub("address")} /></div>
              <Field label="Beds" type="number" value={subject.beds} onChange={setSub("beds")} />
              <Field label="Baths" type="number" value={subject.baths} onChange={setSub("baths")} />
              <Field label="Heated SqFt" type="number" value={subject.sqft} onChange={setSub("sqft")} />
              <Field label="Year Built" type="number" value={subject.yearBuilt} onChange={setSub("yearBuilt")} />
              <Field label="Lot (acres)" type="number" value={subject.lot} onChange={setSub("lot")} />
              <Field label="Garage (cars)" type="number" value={subject.garage} onChange={setSub("garage")} />
              <Field label="Mortgage Payoff ($)" type="number" value={subject.payoff} onChange={setSub("payoff")} />
              <Field label="Est. Close Date" type="date" value={subject.closeDate} onChange={setSub("closeDate")} />
              <Field label="Annual Taxes ($)" type="number" value={subject.taxes} onChange={setSub("taxes")} />
              <Field label="Annual Insurance ($)" type="number" value={subject.insurance} onChange={setSub("insurance")} />
              <Field label="Annual HOA ($)" type="number" value={subject.hoa} onChange={setSub("hoa")} />
              <div className="col-span-2 md:col-span-4"><Field label="Condition notes" value={subject.condition} onChange={setSub("condition")} /></div>
            </div>
          )}
        </section>

        {/* ===== Quick CMA Form (edit mode) ===== */}
        {!clientView && (
          <section className="no-print space-y-4">
            <SectionTitle kicker="Quick CMA Form" title="Fast data entry for a new CMA"
              sub="Paste comps one per line and fill the market snapshot — everything below updates instantly. Use Clear all first for a fresh deal." />

            {/* Bulk comp entry */}
            <div className="rounded-lg border p-4" style={{ borderColor: C.line, background: C.card }}>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-sm font-semibold">Bulk add comps:</span>
                <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)}
                  className="border rounded px-2 py-1.5 text-sm" style={{ borderColor: C.line }}>
                  <option value="active">Active — same bedroom range</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold — last 90 days</option>
                  <option value="expired">Expired — last 90 days</option>
                </select>
                <span className="text-xs" style={{ color: C.mute }}>
                  One per line: {bulkCat === "sold"
                    ? "Address | List Price | Sold Price | Bd | Ba | SqFt | Yr | DOM | Notes"
                    : "Address | List Price | Bd | Ba | SqFt | Yr | DOM | Notes"}
                </span>
              </div>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={4}
                placeholder={bulkCat === "sold"
                  ? "5 Tawny Branch Court | 275000 | 275000 | 3 | 2 | 1700 | 1978 | 62 | 0.40 ac, 2-car"
                  : "1 Oakleaf Court | 325000 | 3 | 2 | 2200 | 1981 | 19 | Renovated"}
                className="w-full border rounded p-2 text-sm font-mono" style={{ borderColor: C.line }} />
              <button onClick={bulkAdd} className="mt-2 px-4 py-2 rounded text-sm font-semibold text-white" style={{ background: C.burgundy }}>
                Add {bulkText.split("\n").filter((l) => l.trim()).length || ""} comps to {CAT_META[bulkCat].title}
              </button>
            </div>

            {/* Market snapshot editor */}
            <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: C.line, background: C.card }}>
              <div className="text-sm font-semibold">24-month market snapshot</div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>Report title</Label><Input value={market.title} onChange={setMkt("title")} /></div>
                <div><Label>Subtitle (sales count · period · area)</Label><Input value={market.subtitle} onChange={setMkt("subtitle")} /></div>
                <div><Label>Live report link</Label><Input value={market.link} onChange={setMkt("link")} /></div>
              </div>
              <div><Label>Data caveat / note (leave blank to hide)</Label><Input value={market.caveat} onChange={setMkt("caveat")} /></div>
              <div>
                <Label>Headline stats</Label>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {market.kpis.map((k, i) => (
                    <div key={k.label} className="border rounded p-2" style={{ borderColor: C.line }}>
                      <div className="text-[10px] font-bold uppercase mb-1" style={{ color: C.mute }}>{k.label}</div>
                      <Input value={k.value} onChange={(v) => setMktKpi(i, "value", v)} />
                      <div className="mt-1"><Input value={k.sub} onChange={(v) => setMktKpi(i, "sub", v)} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Quarterly trend (label / median price / median $ per sqft)</Label>
                  {market.trend.map((t, i) => (
                    <div key={i} className="flex gap-1.5 mb-1">
                      <Input value={t.q} onChange={(v) => setMktRow("trend", i, "q", v)} />
                      <Input type="number" value={t.medPrice} onChange={(v) => setMktRow("trend", i, "medPrice", v)} />
                      <Input type="number" value={t.medPsf} onChange={(v) => setMktRow("trend", i, "medPsf", v)} />
                      <button onClick={() => delMktRow("trend", i)} className="text-xs px-1" style={{ color: C.mute }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addMktRow("trend", { q: "", medPrice: "", medPsf: "" })}
                    className="text-xs font-semibold" style={{ color: C.burgundy }}>+ Add quarter</button>
                </div>
                <div>
                  <Label>% of original ask by DOM band</Label>
                  {market.timeMoney.map((t, i) => (
                    <div key={i} className="flex gap-1.5 mb-1 items-center">
                      <span className="text-xs w-14" style={{ color: C.mute }}>{t.band}</span>
                      <Input type="number" value={t.pct} onChange={(v) => setMktRow("timeMoney", i, "pct", v)} />
                      <Input type="number" value={t.n} onChange={(v) => setMktRow("timeMoney", i, "n", v)} />
                    </div>
                  ))}
                  <div className="text-[10px]" style={{ color: C.mute }}>Left: % of ask kept · Right: # of sales</div>
                </div>
              </div>
              <div>
                <Label>Priced right vs. cut (n / median DOM / % of ask) and average $ lost</Label>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  <Input type="number" value={market.cut.rightN} onChange={(v) => setMktCut("rightN", v)} />
                  <Input type="number" value={market.cut.rightDom} onChange={(v) => setMktCut("rightDom", v)} />
                  <Input type="number" value={market.cut.rightPct} onChange={(v) => setMktCut("rightPct", v)} />
                  <Input type="number" value={market.cut.cutN} onChange={(v) => setMktCut("cutN", v)} />
                  <Input type="number" value={market.cut.cutDom} onChange={(v) => setMktCut("cutDom", v)} />
                  <Input type="number" value={market.cut.cutPct} onChange={(v) => setMktCut("cutPct", v)} />
                  <Input type="number" value={market.cut.avgLoss} onChange={(v) => setMktCut("avgLoss", v)} />
                </div>
                <div className="text-[10px] mt-1" style={{ color: C.mute }}>Priced-right: n, DOM, % · Cut: n, DOM, % · Avg $ lost by cutters</div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>"What buyers want" bullets (one per line)</Label>
                  <textarea value={market.want.join("\n")} onChange={(e) => setMkt("want")(e.target.value.split("\n"))}
                    rows={4} className="w-full border rounded p-2 text-sm" style={{ borderColor: C.line }} />
                </div>
                <div>
                  <Label>"What buyers don't want" bullets (one per line)</Label>
                  <textarea value={market.dontWant.join("\n")} onChange={(e) => setMkt("dontWant")(e.target.value.split("\n"))}
                    rows={4} className="w-full border rounded p-2 text-sm" style={{ borderColor: C.line }} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== 2. Active Buyer Analysis ===== */}
        <section>
          <SectionTitle kicker="Market Snapshot" title="Active Buyer Analysis" sub="Showings scheduled in zip 29212, 3+ bedrooms, $250K–$325K · June 29 – July 29, 2026 (ShowingTime)" />
          <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
            {BUYER_BRACKETS.map((b) => (
              <div key={b.label} className="flex items-center gap-3 py-1.5">
                <div className="w-44 text-sm shrink-0">{b.label}</div>
                <div className="flex-1 h-6 rounded-sm" style={{ background: "#EFEBE3" }}>
                  <div className="h-6 rounded-sm flex items-center justify-end pr-2 text-[11px] font-bold text-white" style={{ width: `${(b.showings / 65) * 100}%`, background: C.burgundy, minWidth: 46 }}>
                    {b.showings}
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-semibold">{b.pct}%</div>
              </div>
            ))}
            <div className="mt-4 rounded p-3 text-sm font-semibold" style={{ background: "#F6EEE9", color: C.burgundy }}>
              Pricing at $275,000 or below reaches 76.81% of the buyers actively touring in this market right now. Above $300K, buyer activity drops to under 1 in 4 showings.
            </div>
          </div>
        </section>

        {/* ===== 3. Time vs. Money ===== */}
        <section>
          <SectionTitle kicker="Pricing Strategy" title="Time vs. Money" sub="The longer a home sits, the less of its list price it captures" />
          <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
            <div className="flex items-end gap-2 h-40">
              {TIME_MONEY.map((t) => (
                <div key={t.band} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-bold" style={{ color: t.pct >= 99 ? C.sold : C.burgundy }}>{t.pct}%</div>
                  <div className="w-full rounded-t" style={{ height: `${(t.pct - 88) * 11}px`, background: t.pct >= 99 ? C.sold : t.pct >= 95 ? C.pending : C.burgundy }} />
                  <div className="text-[11px]" style={{ color: C.mute }}>{t.band}</div>
                </div>
              ))}
            </div>
            <div className="text-center text-[11px] uppercase tracking-wide mt-2" style={{ color: C.mute }}>Days on market → % of list price captured at sale</div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm justify-center">
              <div><span style={{ color: C.mute }}>Average DOM (solds): </span><b>{soldDoms.length ? Math.round(stats.avgDom) : "—"} days</b></div>
              <div><span style={{ color: C.mute }}>Median DOM (solds): </span><b>{soldDoms.length ? Math.round(stats.medDom) : "—"} days</b></div>
            </div>
          </div>
        </section>

        {/* ===== 4. Comp categories ===== */}
        <section className="space-y-6 print-break">
          <SectionTitle kicker="Step 2" title="The Comparables" sub="Presented in listing-appointment order: competition, pendings, solds, then what buyers didn't want" />
          {clientView && Object.values(links).some(Boolean) && (
            <div className="rounded-lg border p-4 text-sm" style={{ borderColor: C.line, background: C.card }}>
              <div className="text-[11px] uppercase font-bold tracking-wide mb-2" style={{ color: C.mute }}>Live MLS reports — view the actual listings anytime</div>
              <div className="space-y-1">
                {[["active", "Active competition"], ["pending", "Pending"], ["sold", "Sold comps"], ["expired", "Expired listings"]].map(([k, label]) => links[k] && (
                  <div key={k} className="flex flex-wrap gap-x-2">
                    <span className="font-semibold" style={{ color: CAT_META[k].color }}>{label}:</span>
                    <a href={links[k]} target="_blank" rel="noopener noreferrer" style={{ color: C.burgundy, wordBreak: "break-all" }}>{links[k]}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {renderCompTable("active")}
          {renderCompTable("pending")}
          {renderCompTable("sold")}
          {renderCompTable("expired")}
        </section>

        {/* ===== 5. Adjustments (edit mode only) ===== */}
        {!clientView && solds.length > 0 && (
          <section className="no-print">
            <SectionTitle kicker="Step 3" title="Adjustments to Sold Comps" sub="Dollar adjustments relative to the subject — positive if the comp is inferior, negative if superior" />
            <div className="rounded-lg border p-4" style={{ borderColor: C.line, background: C.card }}>
              <div className="flex items-center gap-3 mb-4 text-sm">
                <span style={{ color: C.mute }}>Auto SqFt adjustment rate:</span>
                <div className="w-24"><Input type="number" value={sqftRate} onChange={(v) => setSqftRate(v)} /></div>
                <span style={{ color: C.mute }}>$/sqft</span>
                <button
                  onClick={() => solds.forEach((c) => setAdj(c.id, "sqft", Math.round((num(subject.sqft) - num(c.sqft)) * num(sqftRate))))}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white" style={{ background: C.burgundy }}>
                  Apply to all solds
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase" style={{ color: C.mute }}>
                      <th className="px-2 py-2">Sold comp</th>
                      {ADJ_FIELDS.map((k) => <th key={k} className="px-2 py-2">{ADJ_LABELS[k]}</th>)}
                      <th className="px-2 py-2">Total adj.</th>
                      <th className="px-2 py-2">Adjusted value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solds.map((c) => (
                      <tr key={c.id} className="border-t" style={{ borderColor: C.line }}>
                        <td className="px-2 py-2 min-w-[170px]">
                          <div className="font-medium">{c.address.split(",")[0]}</div>
                          <div className="text-[11px]" style={{ color: C.mute }}>{fmtN(c.sqft)} sqft ({num(subject.sqft) - num(c.sqft) >= 0 ? "+" : ""}{fmtN(num(subject.sqft) - num(c.sqft))} vs subject)</div>
                        </td>
                        {ADJ_FIELDS.map((k) => (
                          <td key={k} className="px-2 py-2 min-w-[85px]"><Input type="number" value={getAdj(c.id)[k] ?? ""} onChange={(v) => setAdj(c.id, k, v)} /></td>
                        ))}
                        <td className="px-2 py-2 font-semibold whitespace-nowrap" style={{ color: adjTotal(c.id) === 0 ? C.mute : C.burgundy }}>{fmt$(adjTotal(c.id))}</td>
                        <td className="px-2 py-2 font-bold whitespace-nowrap">{fmt$(compPrice(c) + adjTotal(c.id))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ===== 6. Analysis & Bracketing ===== */}
        <section className="print-break">
          <SectionTitle kicker="Step 4" title="Positioning & Price Bracketing" sub="Where the subject sits against everything a buyer will see" />
          <div className="grid md:grid-cols-4 gap-3 mb-5">
            {[
              ["Avg $/SqFt (solds)", fmt$(stats.avgPsf, 0)],
              ["Median $/SqFt (solds)", fmt$(stats.medPsf, 0)],
              ["Median adj. $/SqFt", fmt$(stats.medAdjPsf, 0)],
              ["Indicated value @ " + fmtN(subject.sqft) + " sqft", fmt$(stats.indicated)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border p-4" style={{ borderColor: C.line, background: C.card }}>
                <div className="text-[11px] uppercase font-bold tracking-wide" style={{ color: C.mute }}>{l}</div>
                <div className="text-2xl mt-1" style={{ fontFamily: serif, color: C.burgundy }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Bracket bar */}
          <div className="rounded-lg border p-5 pb-2 overflow-hidden" style={{ borderColor: C.line, background: C.card }}>
            <div className="relative h-44 mx-8">
              {/* axis */}
              <div className="absolute left-0 right-0 h-px" style={{ top: "50%", background: C.line }} />
              {/* tier band */}
              {num(tiers.bottom) > 0 && num(tiers.best) > 0 && (
                <div className="absolute h-10 rounded" style={{ top: "calc(50% - 20px)", left: pos(num(tiers.bottom)), width: `calc(${pos(num(tiers.best))} - ${pos(num(tiers.bottom))})`, background: "rgba(124,34,48,0.12)", border: `1px dashed ${C.burgundy}` }} />
              )}
              {/* comps above/below the line */}
              {comps.filter((c) => compPrice(c) > 0).map((c, i) => {
                const meta = CAT_META[c.cat];
                const above = c.cat === "active" || c.cat === "expired";
                return (
                  <div key={c.id} className="absolute flex flex-col items-center" style={{ left: pos(compPrice(c)), transform: "translateX(-50%)", [above ? "bottom" : "top"]: "52%" }}>
                    <div className={`text-[10px] whitespace-nowrap ${above ? "order-1 mb-1" : "order-2 mt-1"}`} style={{ color: meta.color, transform: i % 2 ? "translateY(0)" : "translateY(0)" }}>
                      {c.address.split(",")[0].replace(/, Columbia.*/, "")}<br />{fmt$(compPrice(c))}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${above ? "order-2" : "order-1"}`} style={{ background: meta.color, border: "2px solid #fff", boxShadow: "0 0 0 1px " + meta.color }} />
                  </div>
                );
              })}
              {/* tier markers */}
              {tierList.map((t) => num(tiers[t.key]) > 0 && (
                <div key={t.key} className="absolute flex flex-col items-center" style={{ left: pos(num(tiers[t.key])), transform: "translateX(-50%)", top: "calc(50% - 7px)" }}>
                  <div className="w-3.5 h-3.5 rotate-45" style={{ background: C.burgundy }} />
                  <div className="text-[10px] font-bold mt-1" style={{ color: C.burgundy }}>{t.label}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-5 text-[11px] pb-2" style={{ color: C.mute }}>
              {Object.entries(CAT_META).map(([k, m]) => (
                <span key={k} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: m.color }} /> {m.tag}</span>
              ))}
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rotate-45 inline-block" style={{ background: C.burgundy }} /> Recommended tiers</span>
            </div>
          </div>
          <p className="text-sm mt-3" style={{ color: C.mute }}>
            The expired listings at $410K–$437K show where buyers said no. The solds cluster at $235K–$275K, and the strongest buyer traffic sits in the $250K–$299K brackets — the recommended range positions the subject squarely inside proven demand while staying below the renovated competition at $319K–$325K.
          </p>
        </section>

        {/* ===== 7. Price Recommendation ===== */}
        <section>
          <SectionTitle kicker="Step 5" title="Price Range Recommendation" />
          <div className="grid sm:grid-cols-3 gap-4">
            {tierList.map((t, i) => (
              <div key={t.key} className="rounded-lg p-5 text-center border-2" style={{
                borderColor: t.key === "happy" ? C.burgundy : C.line,
                background: t.key === "happy" ? C.burgundy : C.card,
                color: t.key === "happy" ? "#fff" : C.ink,
              }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ opacity: 0.8 }}>{t.label}</div>
                <div className="text-[11px] mb-2" style={{ opacity: 0.7 }}>{t.desc}</div>
                {clientView ? (
                  <div className="text-3xl" style={{ fontFamily: serif }}>{fmt$(tiers[t.key])}</div>
                ) : (
                  <input type="number" value={tiers[t.key]} onChange={(e) => setTier(t.key)(e.target.value)}
                    className="w-full text-center text-2xl rounded px-2 py-1"
                    style={{ fontFamily: serif, background: t.key === "happy" ? "rgba(255,255,255,0.15)" : C.paper, color: "inherit", border: "1px solid rgba(0,0,0,0.1)" }} />
                )}
                <div className="text-xs mt-2" style={{ opacity: 0.75 }}>
                  {num(tiers[t.key]) > 0 && num(subject.sqft) > 0 ? fmt$(num(tiers[t.key]) / num(subject.sqft), 0) + "/sqft" : ""}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 8. Net Sheet ===== */}
        <section className="print-break">
          <SectionTitle kicker="Step 6" title="Seller Net Sheet" sub={`Estimated proceeds at each tier · ${daysToClose} days to close (${subject.closeDate || "set close date"}) · 360-day year prorations`} />
          {!clientView && (
            <div className="rounded-lg border p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3" style={{ borderColor: C.line, background: C.card }}>
              <Field label="Deed stamp rate" type="number" value={fees.deedStampRate} onChange={setFee("deedStampRate")} />
              <Field label="Deed prep ($)" type="number" value={fees.deedPrep} onChange={setFee("deedPrep")} />
              <Field label="CL-100 ($)" type="number" value={fees.cl100} onChange={setFee("cl100")} />
              <Field label="Seller broker (%)" type="number" value={fees.sellerPct} onChange={setFee("sellerPct")} />
              <Field label="Buyer broker (%)" type="number" value={fees.buyerPct} onChange={setFee("buyerPct")} />
              <Field label="Home warranty ($)" type="number" value={fees.warranty} onChange={setFee("warranty")} />
              <Field label="Misc atty fees ($)" type="number" value={fees.misc} onChange={setFee("misc")} />
              <Field label="Renovations ($)" type="number" value={fees.renovations} onChange={setFee("renovations")} />
              <Field label="Repairs ($)" type="number" value={fees.repairs} onChange={setFee("repairs")} />
              <Field label="Special assessments ($)" type="number" value={fees.specialAssessments} onChange={setFee("specialAssessments")} />
              <Field label="Out-of-state withholding (%)" type="number" value={fees.outOfStatePct} onChange={setFee("outOfStatePct")} />
            </div>
          )}
          <div className="rounded-lg border overflow-x-auto" style={{ borderColor: C.line, background: C.card }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.burgundy, color: "#fff" }}>
                  <th className="text-left px-4 py-2.5 font-semibold">Line item</th>
                  {tierList.map((t) => (
                    <th key={t.key} className="text-right px-4 py-2.5 font-semibold">{t.label}<div className="text-[11px] font-normal opacity-80">{fmt$(tiers[t.key])}</div></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t font-semibold" style={{ borderColor: C.line }}>
                  <td className="px-4 py-2">Sales Price</td>
                  {tierList.map((t) => <td key={t.key} className="text-right px-4 py-2">{fmt$(tiers[t.key])}</td>)}
                </tr>
                {netFor(tiers.bottom).rows.map((row, i) => {
                  const allZero = tierList.every((t) => Math.abs(netFor(tiers[t.key]).rows[i][1]) < 0.005);
                  if (allZero && clientView) return null;
                  return (
                    <tr key={i} className="border-t" style={{ borderColor: C.line }}>
                      <td className="px-4 py-1.5" style={{ color: C.mute }}>
                        {row[0]}{row[2] && <span className="text-[11px] ml-1.5 opacity-70">({row[2]})</span>}
                      </td>
                      {tierList.map((t) => {
                        const v = netFor(tiers[t.key]).rows[i][1];
                        return <td key={t.key} className="text-right px-4 py-1.5" style={{ color: v < 0 ? C.ink : C.mute }}>{Math.abs(v) < 0.005 ? "0" : fmt$(v)}</td>;
                      })}
                    </tr>
                  );
                })}
                <tr className="border-t font-semibold" style={{ borderColor: C.ink }}>
                  <td className="px-4 py-2">Seller Expenses (total)</td>
                  {tierList.map((t) => <td key={t.key} className="text-right px-4 py-2">{fmt$(netFor(tiers[t.key]).total)}</td>)}
                </tr>
                <tr style={{ background: "#F3F7F1" }}>
                  <td className="px-4 py-3 font-bold" style={{ color: C.sold }}>Estimated Net to Seller</td>
                  {tierList.map((t) => (
                    <td key={t.key} className="text-right px-4 py-3 text-lg font-bold" style={{ color: C.sold, fontFamily: serif }}>{fmt$(netFor(tiers[t.key]).net)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-2" style={{ color: C.mute }}>
            This worksheet provides an estimate only. Final figures come from the closing attorney's office. HOA note: .0019 × market value plus $185; $50 transfer/doc fees.
          </p>
        </section>

        {/* ===== Market Report ===== */}
        <section className="print-break space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.burgundy }}>Market Report</div>
            <h2 className="text-3xl" style={{ fontFamily: serif, color: C.ink }}>{market.title}</h2>
            {market.subtitle && <p className="text-sm mt-1" style={{ color: C.mute }}>{market.subtitle}</p>}
          </div>

          {market.caveat && (
            <div className="rounded-lg p-4 text-sm border-l-4" style={{ background: "#FBF4E8", borderColor: C.pending, color: C.ink }}>
              <b>About this sample:</b> {market.caveat}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {market.kpis.map((k) => (
              <div key={k.label} className="rounded-lg border p-4 text-center" style={{ borderColor: C.line, background: C.card }}>
                <div className="text-2xl" style={{ fontFamily: serif, color: C.burgundy }}>{k.value || "—"}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide mt-1" style={{ color: C.ink }}>{k.label}</div>
                <div className="text-[11px]" style={{ color: C.mute }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {market.trend.length > 0 && (
          <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
            <SectionTitle kicker="Market trend" title="Median sold price & $/sqft by quarter" />
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={market.trend.map((t) => ({ ...t, medPrice: num(t.medPrice), medPsf: num(t.medPsf) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="q" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="p" tickFormatter={(v) => "$" + Math.round(v / 1000) + "K"} tick={{ fontSize: 12 }} domain={["dataMin - 10000", "dataMax + 10000"]} />
                <YAxis yAxisId="s" orientation="right" tickFormatter={(v) => "$" + v} tick={{ fontSize: 12 }} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip contentStyle={{ fontSize: 12, border: `1px solid ${C.line}`, borderRadius: 6 }}
                  formatter={(v, name) => name === "Median sold price" ? [fmt$(v), name] : ["$" + v, name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="p" dataKey="medPrice" name="Median sold price" fill={C.burgundy} radius={[3, 3, 0, 0]} opacity={0.85} />
                <Line yAxisId="s" dataKey="medPsf" name="Median $/sqft" stroke={C.pending} strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          )}

          {market.timeMoney.some((t) => num(t.pct) > 0) && (
          <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
            <SectionTitle kicker="Time vs. Money — proven in this market" title="% of original asking price kept, by days on market" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={market.timeMoney.map((t) => ({ ...t, pct: num(t.pct) }))} margin={{ top: 22, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 100]} tickFormatter={(v) => v + "%"} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12, border: `1px solid ${C.line}`, borderRadius: 6 }}
                  formatter={(v, n, p) => [v + "% of original ask (" + p.payload.n + " sales)", ""]} />
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="pct" position="top" formatter={(v) => v + "%"} style={{ fontSize: 11, fontWeight: 700 }} />
                  {market.timeMoney.map((d, i) => (
                    <Cell key={i} fill={num(d.pct) >= 96 ? C.sold : num(d.pct) >= 90 ? C.pending : C.burgundy} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}

          {num(market.cut.avgLoss) > 0 && (
          <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
            <SectionTitle kicker="The cost of overpricing" title="Priced right vs. priced high, then cut"
              sub={`${market.cut.cutN} of ${num(market.cut.rightN) + num(market.cut.cutN)} sellers had to cut their price before selling.`} />
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={[
                    { metric: "Median days on market", right: num(market.cut.rightDom), cut: num(market.cut.cutDom) },
                    { metric: "% of original ask kept", right: num(market.cut.rightPct), cut: num(market.cut.cutPct) },
                  ]} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke={C.line} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="metric" width={170} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ fontSize: 12, border: `1px solid ${C.line}`, borderRadius: 6 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="right" name={`Priced right (${market.cut.rightN} sales)`} fill={C.sold} radius={[0, 3, 3, 0]}>
                      <LabelList dataKey="right" position="right" style={{ fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                    <Bar dataKey="cut" name={`Cut price to sell (${market.cut.cutN} sales)`} fill={C.burgundy} radius={[0, 3, 3, 0]}>
                      <LabelList dataKey="cut" position="right" style={{ fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg p-5 text-center" style={{ background: C.burgundy, color: "#fff" }}>
                <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">Average given up by price-cutters</div>
                <div className="text-4xl my-2" style={{ fontFamily: serif }}>{fmt$(num(market.cut.avgLoss))}</div>
                <div className="text-xs opacity-85">below their original asking price — vs. homes priced right on day one</div>
              </div>
            </div>
          </div>
          )}

          {(market.want.filter(Boolean).length > 0 || market.dontWant.filter(Boolean).length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
              <SectionTitle kicker="What buyers want" title="The profile of a fast sale" />
              <ul className="text-sm space-y-2.5" style={{ color: C.ink }}>
                {market.want.filter(Boolean).map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border p-5" style={{ borderColor: C.line, background: C.card }}>
              <SectionTitle kicker="What buyers don't want" title="The profile of a stale listing" />
              <ul className="text-sm space-y-2.5" style={{ color: C.ink }}>
                {market.dontWant.filter(Boolean).map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>
          </div>
          )}

          {market.link && (
            <div className="text-sm">
              <a href={market.link} target="_blank" rel="noopener noreferrer"
                className="font-semibold" style={{ color: C.burgundy }}>
                View the live MLS sales report ↗
              </a>
            </div>
          )}
        </section>

        {/* ===== Footer / branding ===== */}
        <footer className="pt-6 border-t" style={{ borderColor: C.line }}>
          <div className="text-center mb-2">
            <span className="text-lg font-bold" style={{ fontFamily: serif, color: C.burgundy }}>Southern Visions Real Estate</span>
          </div>
          {contactBar}
          <div className="text-center text-[11px] italic mt-2 mb-8" style={{ color: C.burgundy, fontFamily: serif }}>
            "Your Home SOLD for the highest price. NO EXCEPTIONS. NO EXCUSES."
          </div>
        </footer>
      </main>
    </div>
  );
}
