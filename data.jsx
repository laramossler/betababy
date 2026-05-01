// ─── DESIGN SYSTEM ─────────────────────────────────────────
const C = {
  bg: "#0A0908",
  bgSoft: "#111010",
  card: "#151413",
  cardHover: "#1C1B19",
  cream: "#EDE8DF",
  creamSoft: "#B8B0A2",
  gold: "#B8A07A",
  goldDeep: "#9A8460",
  goldMuted: "#7A6D54",
  stone: "#928679",
  blush: "#C4A89A",
  sage: "#8E9E82",
  sea: "#7A9BA0",
  dusk: "#9890AE",
  border: "#252320",
  borderLight: "#322F2B",
  red: "#B07070",
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Cormorant Garamond', Garamond, serif",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
  mono: "'JetBrains Mono', monospace",
  cn: "'Noto Serif SC', serif",
};

// ─── CHLOE'S CONTEXT ───────────────────────────────────────
const ME = {
  name: "Chloe",
  fullName: "Chloe Lam",
  initial: "C",
  cnName: "林晚晴",
  city: "Hong Kong",
  city2: "London",
  podcast: "The Long Way Home",
  pet: { name: "Biscuit", breed: "Pomeranian", emoji: "🐕", weight: "3.2kg" },
};

const CONCIERGE = {
  name: "Margaux",
  role: "Your concierge",
  city: "Paris",
  hours: "08:00 – 23:00 CET",
  intro: "I work with twelve members. I know the chef at Le Doyenné. Tell me what you want.",
};

// ─── PEOPLE / CIRCLE ───────────────────────────────────────
const CIRCLE = [
  { id: "chloe", name: "Chloe", initial: "C", city: "Hong Kong", you: true },
  { id: "sophia", name: "Sophia", initial: "S", city: "Los Angeles", role: "Producer" },
  { id: "aria", name: "Aria", initial: "A", city: "Singapore", role: "Founder, Marisol Studio" },
  { id: "noor", name: "Noor", initial: "N", city: "Dubai", role: "Architect" },
  { id: "iris", name: "Iris", initial: "I", city: "London", role: "Gallerist" },
  { id: "yuki", name: "Yuki", initial: "Y", city: "Tokyo", role: "Artist" },
];

// ─── TRIPS (multi-trip dashboard) ──────────────────────────
const TRIPS = [
  {
    id: "riviera",
    title: "The South of France",
    sub: "Côte d'Azur",
    dates: "May 12 — 17, 2026",
    daysOut: 11,
    cover: "#3A4A52",
    coverGrad: "linear-gradient(135deg, #3A4A52 0%, #5A6E70 60%, #B8A07A 100%)",
    status: "active",
    role: "host",
    guests: ["chloe", "sophia", "aria", "noor"],
    pets: ["biscuit"],
    note: "Four of us. Private villa. Pet-cleared.",
    progress: { booked: 7, ready: 3, pending: 6, none: 2 },
  },
  {
    id: "kyoto",
    title: "Kyoto in Cherry Bloom",
    sub: "Higashiyama & beyond",
    dates: "Mar 28 — Apr 3, 2026",
    daysOut: -38,
    cover: "#7A6D54",
    coverGrad: "linear-gradient(135deg, #2A2520 0%, #6A4F3A 50%, #C4A89A 100%)",
    status: "past",
    role: "host",
    guests: ["chloe", "yuki", "iris"],
    note: "The one we're still talking about.",
  },
  {
    id: "amalfi",
    title: "Amalfi for Iris's 40th",
    sub: "Praiano",
    dates: "Sep 15 — 21, 2026",
    daysOut: 137,
    cover: "#5A4A3A",
    coverGrad: "linear-gradient(135deg, #1A2A3A 0%, #4A6A8A 60%, #EDE8DF 100%)",
    status: "drafting",
    role: "guest",
    host: "iris",
    note: "Iris is hosting. You replied 'in.'",
  },
  {
    id: "marrakech",
    title: "Marrakech Long Weekend",
    sub: "Riad Yima",
    dates: "Jan 22 — 25, 2026",
    daysOut: -98,
    cover: "#8A5A3A",
    coverGrad: "linear-gradient(135deg, #4A2A1A 0%, #B07050 70%, #EDD0A0 100%)",
    status: "past",
    role: "guest",
    note: "Noor's birthday. Three nights. Perfect.",
  },
];

// ─── VIBES ─────────────────────────────────────────────────
const VIBES = [
  { id: "restore", word: "Restore", sub: "Stillness, sea air, white linen mornings", color: "#D4CFC4" },
  { id: "explore", word: "Explore", sub: "Cobblestone light, hidden doors, the unknown corner", color: "#C4B898" },
  { id: "indulge", word: "Indulge", sub: "Long tables, candlelight, the sommelier's quiet suggestion", color: C.gold },
  { id: "escape", word: "Escape", sub: "Private coves, no itinerary, nowhere you need to be", color: C.sea },
  { id: "adventure", word: "Adventure", sub: "Open water, a sunrise you earned, salt on skin", color: C.sage },
  { id: "celebrate", word: "Celebrate", sub: "Terraces at night, the right dress, that feeling", color: C.blush },
];

// ─── WEEK PLAN (Riviera) ───────────────────────────────────
const WEEK = [
  {
    day: 1, date: "May 12", title: "Arrival", theme: "The Beginning",
    events: [
      { id: "e1", time: "10h45", title: "Nice Côte d'Azur", sub: "Private arrival, terminal aviation", detail: "Driver waiting. Biscuit's pet papers cleared at French customs in advance.", dress: "Travel — linen, silk, something you felt good boarding in", locked: true, pet: true, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 }},
      { id: "e2", time: "16h00", title: "Villa Check-In", sub: "Saint-Jean-Cap-Ferrat", detail: "Private villa. Staff greeting. Champagne is poured before luggage is unpacked. Biscuit's bowl, bed, and Provençal lamb dinner are already set up in your suite.", dress: "Travel ease", locked: true, pet: true, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
      { id: "e3", time: "20h30", title: "Welcome Dinner", sub: "Private chef, at the villa", detail: "Seven courses. Provençal menu. The table is set before you arrive.", dress: "Resort evening — movement in the fabric. No heels necessary. Earrings.", locked: false, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
    ],
  },
  {
    day: 2, date: "May 13", title: "The Slow Day", theme: "Settling In",
    events: [
      { id: "e4", time: "09h00", title: "Yoga + breakfast", sub: "Terrace overlooking the bay", detail: "Instructor at nine. Village croissants, fresh figs, thick coffee.", dress: "Beautiful loungewear", locked: false, votes: { sophia: 1 } },
      { id: "e5", time: "12h00", title: "Paloma Beach", sub: "The hidden cove", detail: "Grilled catch, rosé, sand underfoot. Dog-friendly terrace booked.", dress: "Swimsuit under a cover-up. Straw hat. Flat sandal.", locked: false, pet: true, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 },
        alts: [
          { id: "a1", title: "La Guérite, Île Sainte-Marguerite", detail: "Boat to a private island. More of a journey." },
          { id: "a2", title: "Villa Ephrussi Gardens Picnic", detail: "Private access among the Rothschild roses." },
        ] },
      { id: "e6", time: "16h00", title: "Spa at Cap-Ferrat", sub: "Two-hour treatment", detail: "Four Seasons. Pool access after. Biscuit-sitter (vetted) at the villa from 15h.", dress: "Robe provided. Bring your best swim look for the pool.", locked: true, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
      { id: "e7", time: "20h30", title: "La Mère Germaine", sub: "Villefranche, waterfront", detail: "Bouillabaisse perfected since 1938.", dress: "Mediterranean evening — something with movement.", locked: false, votes: { chloe: 1, aria: 1 } },
    ],
  },
  {
    day: 3, date: "May 14", title: "Wine Country", theme: "The Exploration",
    events: [
      { id: "e8", time: "10h00", title: "Drive into Provence", sub: "Private car, scenic route", detail: "Two hours through lavender and limestone. Biscuit comes — pet-cleared SUV.", dress: "Day trip — wide brim, flat sandal.", locked: false, pet: true, votes: { sophia: 1, noor: 1 } },
      { id: "e9", time: "12h30", title: "Château de Berne", sub: "Private vineyard tasting", detail: "Their rosé poured at Cannes. Lunch among the vines. Dogs welcome on the terrace.", dress: "Countryside all day.", locked: false, pet: true, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
      { id: "e10", time: "20h00", title: "Bastide de Moustiers", sub: "Alain Ducasse's country table", detail: "Kitchen garden. Stars overhead. Biscuit with sitter at villa.", dress: "Elevated countryside — midi dress, bare shoulders.", locked: false, votes: { chloe: 1, sophia: 1, aria: 1 } },
    ],
  },
  {
    day: 4, date: "May 15", title: "The Adventure", theme: "Breaking Open",
    events: [
      { id: "e11", time: "08h00", title: "Sunrise Boat Charter", sub: "Private, from Nice", detail: "East along the coast. Hidden calanques. Crew handles everything. Pet life-vest sent ahead — Biscuit on board.", dress: "Nautical — best swimsuit, proper cover-up, bare feet.", locked: true, pet: true, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
      { id: "e12", time: "19h00", title: "Sundowners", sub: "La Réserve de Beaulieu", detail: "Sun drops behind Èze. This is the photograph.", dress: "Golden hour — silk, warm tones, gold.", locked: false, votes: { chloe: 1, sophia: 1, noor: 1 } },
      { id: "e13", time: "21h00", title: "African Queen", sub: "Beaulieu-sur-Mer, waterfront", detail: "Where Bardot ate. Seafood platters. The dressiest night.", dress: "Riviera night — heels encouraged.", locked: false, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
    ],
  },
  {
    day: 5, date: "May 16", title: "Culture & Close", theme: "The Farewell",
    events: [
      { id: "e14", time: "10h00", title: "Matisse Chapel", sub: "Vence — by appointment", detail: "His last masterwork. Fifteen minutes inside changes you.", dress: "Walkable. Shoulders covered for the chapel.", locked: false, votes: { aria: 1, chloe: 1 } },
      { id: "e15", time: "12h30", title: "Perfume Workshop", sub: "Historic parfumerie, Grasse", detail: "Compose your own scent. Each person leaves with a bespoke bottle.", dress: "Same as morning.", locked: false, votes: { sophia: 1, noor: 1, chloe: 1 } },
      { id: "e16", time: "20h30", title: "Farewell Dinner", sub: "Under the olive trees", detail: "Private chef. The wines you loved most. Candles, cut roses, the good glasses again. A toast from Chloe.", dress: "Your favourite look of the trip.", locked: false, votes: { chloe: 1, sophia: 1, aria: 1, noor: 1 } },
    ],
  },
];

// ─── PET LOGISTICS (Biscuit) ───────────────────────────────
const PET_TASKS = [
  { id: "p1", title: "EU Animal Health Certificate", sub: "Valid until May 22, 2026", status: "done", who: "Concierge" },
  { id: "p2", title: "Rabies titre test on file", sub: "Cleared 2025-11", status: "done" },
  { id: "p3", title: "ISO microchip verified", sub: "991 00012 4458 — confirmed", status: "done" },
  { id: "p4", title: "Pet-friendly transit at NCE", sub: "Private terminal — no quarantine", status: "done", who: "Concierge" },
  { id: "p5", title: "Vetted dog-sitter at villa", sub: "Élise — three references — fluent EN/FR", status: "done", who: "Concierge" },
  { id: "p6", title: "On-call vet 24/7", sub: "Dr. Reynaud, Beaulieu — 4min from villa", status: "done" },
  { id: "p7", title: "Provençal lamb meal plan", sub: "Single-protein, weighed daily", status: "ready" },
  { id: "p8", title: "Return to HK — import permit", sub: "Submit by Apr 28", status: "pending", due: "12 days" },
];

// ─── BLACK BOOK ────────────────────────────────────────────
const BLACK_BOOK = [
  { id: "b1", name: "Le Doyenné", city: "Saint-Vrain", type: "Restaurant", note: "James and Shaun. Ask for the room overlooking the kitchen garden.", visited: 2, lastSeen: "Jun 2025", color: C.sage },
  { id: "b2", name: "Aman Tokyo", city: "Tokyo", type: "Hotel", note: "Suite 3304. The bath at dusk. Ms. Tanaka knows Biscuit.", visited: 4, lastSeen: "Mar 2026", color: C.dusk },
  { id: "b3", name: "Chiltern Firehouse Suite 4", city: "London", type: "Hotel", note: "Marylebone view. The good pillows.", visited: 7, lastSeen: "Feb 2026", color: C.blush },
  { id: "b4", name: "Madame Florence", city: "Paris", type: "Stylist", note: "Reads dress-codes like scripture. Pulls before you arrive.", visited: 5, lastSeen: "Jan 2026", color: C.gold },
  { id: "b5", name: "Captain Henri", city: "Antibes", type: "Yacht charter", note: "His boat, his rules, his catch. Biscuit-friendly.", visited: 2, lastSeen: "Aug 2025", color: C.sea },
  { id: "b6", name: "Vasanti, Aman", city: "Jaipur", type: "Spa therapist", note: "Ninety minutes that rearranges you.", visited: 3, lastSeen: "Nov 2025", color: C.blush },
];

// ─── VOICE NOTES (Chloe is a podcast host — voice memory) ──
const VOICE_NOTES = [
  { id: "v1", trip: "Kyoto", date: "Apr 1", duration: "0:48", title: "Note to self after Kennin-ji", quote: "The garden's not the point. The walking-back is the point.", color: C.dusk },
  { id: "v2", trip: "Marrakech", date: "Jan 23", duration: "1:14", title: "Yuki at the riad", quote: "I want to be the kind of friend you call from the airport.", who: "Yuki", color: C.blush },
  { id: "v3", trip: "Marrakech", date: "Jan 24", duration: "0:32", title: "Souk, evening", quote: "Three colours of saffron and they all taste different.", color: C.gold },
  { id: "v4", trip: "Kyoto", date: "Mar 30", duration: "2:01", title: "Iris on hosting", quote: "Hosting is the deepest form of attention.", who: "Iris", color: C.sage },
];

// ─── CONCIERGE THREAD ──────────────────────────────────────
const CONCIERGE_THREAD = [
  { from: "me", time: "Yesterday, 22:14", body: "Biscuit's import permit for the HK return — can you handle?" },
  { from: "margaux", time: "Yesterday, 22:18", body: "Already on it. I'll need his updated rabies titre — last one's still valid through August. Done by Friday. Anything else worrying you?" },
  { from: "me", time: "Yesterday, 22:20", body: "Aria mentioned wanting a sound bath one afternoon. Possible?" },
  { from: "margaux", time: "Yesterday, 22:34", body: "I have someone. Mira — Indian classical singer who does private sessions. She's done Cap-Ferrat twice. Wednesday afternoon at the villa, two hours. €1,800. Want me to hold her?" },
  { from: "me", time: "Today, 09:02", body: "Yes. Hold." },
  { from: "margaux", time: "Today, 09:03", body: "Held. I'll add it to the plan as a soft option — your call to lock." },
];

// ─── GATHERINGS (the future arc) ───────────────────────────
const GATHERINGS = [
  {
    id: "g1",
    title: "Biscuits & Bordeaux",
    sub: "A salon supper for podcast hosts",
    when: "Sept 2026",
    where: "Chloe's Marylebone flat",
    capacity: 12,
    rsvp: 4,
    status: "drafting",
    desc: "Eight women I've interviewed. Four I want to. One long table.",
  },
];

window.LEDGER = { C, F, ME, CONCIERGE, CIRCLE, TRIPS, VIBES, WEEK, PET_TASKS, BLACK_BOOK, VOICE_NOTES, CONCIERGE_THREAD, GATHERINGS };
