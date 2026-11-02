/*
 * Directory data.
 *
 * SPORTS: the sport catalogue (used for filter chips, marker icons and colours).
 * LISTINGS: sample directory entries. Positions are stored as offsets in km
 * (east, north) from a centre point so the demo works wherever the visitor is.
 * Swap these for real coordinates (lat/lng) when you have a backend; app.js
 * accepts either `lat`/`lng` or `offset: [eastKm, northKm]`.
 */
window.SPORTS = {
  football:   { label: "Football",   icon: "⚽", color: "#16a34a" },
  cricket:    { label: "Cricket",    icon: "🏏", color: "#ca8a04" },
  badminton:  { label: "Badminton",  icon: "🏸", color: "#0891b2" },
  tennis:     { label: "Tennis",     icon: "🎾", color: "#65a30d" },
  basketball: { label: "Basketball", icon: "🏀", color: "#ea580c" },
  swimming:   { label: "Swimming",   icon: "🏊", color: "#2563eb" },
  fitness:    { label: "Fitness",    icon: "🏋️", color: "#dc2626" },
  yoga:       { label: "Yoga",       icon: "🧘", color: "#9333ea" },
  martial:    { label: "Martial Arts", icon: "🥋", color: "#475569" },
  running:    { label: "Running",    icon: "🏃", color: "#db2777" },
};

window.LISTINGS = [
  { id: "l1",  name: "Greenfield Football Club", type: "club", sports: ["football"], price: 1800, rating: 4.6, reviews: 212, offset: [1.2, 0.8], address: "Greenfield Sports Ground, Gate 2", phone: "+91 98100 11001", hours: "6–9 AM, 4–8 PM", desc: "Community club with U-10 to senior squads, weekend leagues and floodlit 7-a-side turf." },
  { id: "l2",  name: "Coach Arjun Mehta", type: "trainer", sports: ["fitness", "running"], price: 6000, rating: 4.9, reviews: 87, offset: [-0.6, 1.4], address: "Home visits & Lakeside Park", phone: "+91 98100 11002", hours: "By appointment", desc: "Certified strength & conditioning coach. Marathon prep, fat-loss and mobility programmes." },
  { id: "l3",  name: "Smash Point Badminton Academy", type: "academy", sports: ["badminton"], price: 2500, rating: 4.4, reviews: 340, offset: [2.4, -1.1], address: "Smash Point Arena, 2nd Floor", phone: "+91 98100 11003", hours: "5 AM – 10 PM", desc: "8 wooden courts, BWF-level coaches, beginner to state-level batches." },
  { id: "l4",  name: "Willow & Stumps Cricket Academy", type: "academy", sports: ["cricket"], price: 3500, rating: 4.7, reviews: 158, offset: [-3.1, -2.2], address: "Riverside Cricket Ground", phone: "+91 98100 11004", hours: "6–10 AM, 3–7 PM", desc: "Turf wickets, bowling machines and video analysis. Ex-Ranji coaching staff." },
  { id: "l5",  name: "Aqua Blue Swim School", type: "academy", sports: ["swimming"], price: 3000, rating: 4.3, reviews: 120, offset: [0.4, -2.6], address: "Municipal Aquatic Centre", phone: "+91 98100 11005", hours: "6 AM – 8 PM", desc: "Heated 25 m pool. Learn-to-swim for kids, adult stroke correction, competitive squad." },
  { id: "l6",  name: "Hoops United", type: "club", sports: ["basketball"], price: 1200, rating: 4.1, reviews: 64, offset: [3.8, 2.0], address: "Community Centre Court", phone: "+91 98100 11006", hours: "5–9 PM", desc: "Open runs Tue/Thu, 3x3 tournaments monthly. All levels welcome." },
  { id: "l7",  name: "Serenity Yoga Studio", type: "academy", sports: ["yoga"], price: 2200, rating: 4.8, reviews: 295, offset: [-1.5, -0.4], address: "12 Park View Road", phone: "+91 98100 11007", hours: "6 AM – 8 PM", desc: "Hatha, Ashtanga and prenatal classes in a calm, air-conditioned studio." },
  { id: "l8",  name: "Ace Tennis Centre", type: "academy", sports: ["tennis"], price: 5000, rating: 4.5, reviews: 98, offset: [5.2, -3.4], address: "Ace Courts, Club Road", phone: "+91 98100 11008", hours: "6–10 AM, 4–9 PM", desc: "4 hard + 2 clay courts. AITA-certified coaches, junior development programme." },
  { id: "l9",  name: "Iron Temple Gym", type: "club", sports: ["fitness"], price: 1500, rating: 3.9, reviews: 410, offset: [0.9, 0.2], address: "Main Market, Block C", phone: "+91 98100 11009", hours: "5 AM – 11 PM", desc: "Free weights, cardio deck and group classes. No-frills, great value." },
  { id: "l10", name: "Dragon Dojo Karate & MMA", type: "academy", sports: ["martial"], price: 2000, rating: 4.6, reviews: 143, offset: [-2.7, 1.9], address: "Dragon Dojo, Sector 4", phone: "+91 98100 11010", hours: "4–9 PM", desc: "Karate (WKF syllabus), kickboxing and MMA. Kids self-defence batches on weekends." },
  { id: "l11", name: "Coach Priya Nair (Badminton)", type: "trainer", sports: ["badminton"], price: 4000, rating: 4.7, reviews: 52, offset: [1.8, -0.5], address: "Courts across the city", phone: "+91 98100 11011", hours: "By appointment", desc: "Former national-level player offering 1-on-1 and small-group footwork & technique sessions." },
  { id: "l12", name: "Sunrise Runners Club", type: "club", sports: ["running"], price: 500, rating: 4.5, reviews: 380, offset: [-0.2, 3.1], address: "Lake Promenade, North Gate", phone: "+91 98100 11012", hours: "Sat/Sun 5:30 AM", desc: "Free-to-join weekend runs, paid coached plans for 10K, half and full marathons." },
  { id: "l13", name: "Kickoff Futsal Arena", type: "club", sports: ["football"], price: 1000, rating: 3.6, reviews: 75, offset: [4.5, 0.6], address: "Kickoff Arena, Ring Road", phone: "+91 98100 11013", hours: "6 AM – midnight", desc: "Pay-and-play futsal turf with casual weeknight leagues." },
  { id: "l14", name: "Champions Multi-Sport Academy", type: "academy", sports: ["football", "basketball", "swimming"], price: 4500, rating: 4.2, reviews: 201, offset: [-4.6, -0.8], address: "Champions Complex, Highway Exit 3", phone: "+91 98100 11014", hours: "6 AM – 9 PM", desc: "All-in-one membership for kids aged 5–16 across three sports." },
  { id: "l15", name: "Coach Rahul Verma (Cricket)", type: "trainer", sports: ["cricket"], price: 7000, rating: 4.8, reviews: 39, offset: [-2.0, -3.5], address: "Riverside nets", phone: "+91 98100 11015", hours: "By appointment", desc: "Personal batting & spin-bowling coaching with ball-tracking feedback." },
  { id: "l16", name: "FlexFit CrossTraining", type: "club", sports: ["fitness"], price: 3200, rating: 4.4, reviews: 166, offset: [2.9, 3.3], address: "FlexFit Box, Tech Park", phone: "+91 98100 11016", hours: "6 AM – 10 PM", desc: "Functional training box with coached WODs, Olympic lifting and HYROX prep." },
  { id: "l17", name: "Lotus Yoga Collective", type: "club", sports: ["yoga"], price: 900, rating: 4.0, reviews: 58, offset: [6.8, 1.5], address: "Community Hall, Lotus Colony", phone: "+91 98100 11017", hours: "6–8 AM", desc: "Donation-based morning yoga run by volunteers." },
  { id: "l18", name: "Coach Sana Khan (Swimming)", type: "trainer", sports: ["swimming"], price: 5500, rating: 4.6, reviews: 44, offset: [0.1, -4.2], address: "Aquatic Centre & private pools", phone: "+91 98100 11018", hours: "By appointment", desc: "Fear-of-water specialist and triathlon swim coach." },
  { id: "l19", name: "Baseline Tennis Club", type: "club", sports: ["tennis"], price: 2800, rating: 3.8, reviews: 33, offset: [-6.2, 2.7], address: "Baseline Club, Hill Road", phone: "+91 98100 11019", hours: "6 AM – 9 PM", desc: "Members' club with ladder matches and social doubles nights." },
  { id: "l20", name: "Elite Football Academy", type: "academy", sports: ["football"], price: 4000, rating: 4.8, reviews: 260, offset: [-1.0, -6.0], address: "Elite Training Centre", phone: "+91 98100 11020", hours: "6–9 AM, 4–7 PM", desc: "UEFA-licensed coaches, scouting links and residential camps." },
  { id: "l21", name: "Shuttle Kings Club", type: "club", sports: ["badminton"], price: 800, rating: 3.5, reviews: 47, offset: [7.5, -2.0], address: "Shuttle Kings Hall", phone: "+91 98100 11021", hours: "6–9 PM", desc: "Casual evening play, court booking by the hour." },
  { id: "l22", name: "Fight Fit Boxing", type: "academy", sports: ["martial", "fitness"], price: 2600, rating: 4.3, reviews: 112, offset: [3.3, -4.8], address: "Basement, City Mall", phone: "+91 98100 11022", hours: "6 AM – 10 PM", desc: "Boxing technique, bag work and conditioning circuits." },
  { id: "l23", name: "Coach Meera Iyer (Yoga)", type: "trainer", sports: ["yoga"], price: 3500, rating: 4.9, reviews: 71, offset: [-3.8, 3.9], address: "Online & home sessions", phone: "+91 98100 11023", hours: "By appointment", desc: "Therapeutic yoga for back pain, posture and stress management." },
  { id: "l24", name: "Cover Drive Cricket Club", type: "club", sports: ["cricket"], price: 1500, rating: 4.0, reviews: 90, offset: [8.9, 4.2], address: "East End Maidan", phone: "+91 98100 11024", hours: "Weekends 7 AM", desc: "Weekend tennis-ball and leather-ball leagues for adults." },
  { id: "l25", name: "Slam Dunk Basketball Academy", type: "academy", sports: ["basketball"], price: 3000, rating: 4.6, reviews: 84, offset: [-7.4, -4.1], address: "Slam Dunk Indoor Court", phone: "+91 98100 11025", hours: "4–8 PM", desc: "Structured skill levels, NBA-style drills and inter-academy tournaments." },
  { id: "l26", name: "Coach Dev Singh (Tennis)", type: "trainer", sports: ["tennis"], price: 8000, rating: 4.7, reviews: 28, offset: [1.6, 5.4], address: "Courts across north side", phone: "+91 98100 11026", hours: "By appointment", desc: "ITF Level 2 coach. Private lessons for juniors targeting AITA rankings." },
  { id: "l27", name: "Trail Blazers Running Crew", type: "club", sports: ["running"], price: 0, rating: 4.2, reviews: 150, offset: [-5.5, 6.3], address: "Forest Trail Entrance", phone: "+91 98100 11027", hours: "Sun 6 AM", desc: "Free community trail runs. Bring water and a smile." },
  { id: "l28", name: "Blue Lagoon Aquatics Club", type: "club", sports: ["swimming"], price: 2000, rating: 3.7, reviews: 66, offset: [10.5, -6.5], address: "Blue Lagoon Resort Pool", phone: "+91 98100 11028", hours: "6 AM – 7 PM", desc: "Lap swimming memberships and masters squad." },
  { id: "l29", name: "Zen Martial Arts Centre", type: "academy", sports: ["martial", "yoga"], price: 2400, rating: 4.4, reviews: 77, offset: [-9.6, 1.0], address: "Zen Centre, Old Town", phone: "+91 98100 11029", hours: "6–8 AM, 5–8 PM", desc: "Taekwondo, Wing Chun and meditation classes." },
  { id: "l30", name: "PowerHouse Personal Training", type: "trainer", sports: ["fitness"], price: 9500, rating: 4.5, reviews: 36, offset: [12.0, 8.0], address: "PowerHouse Private Studio", phone: "+91 98100 11030", hours: "By appointment", desc: "Premium 1-on-1 coaching with nutrition plans and body-composition tracking." },
];
