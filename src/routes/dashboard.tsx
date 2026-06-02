import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Check, Calendar, Compass, Radio, ChevronRight, Hotel, Lock, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { GlobalTimeHub } from "@/components/aurum/GlobalTimeHub";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import type { IndustryId } from "@/lib/industry/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateRecommendation, generateDailyTasks } from "@/lib/identity.functions";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const WELCOMES = [
  "Today is a quiet step toward an extraordinary life.",
  "The world rewards those who show up with intention. Begin.",
  "Elite operators do today what others postpone. Move first.",
  "A single conversation today can reshape your next decade.",
  "Refinement is built in silence, before the world notices.",
  "Your network is watching. Give them something worth remembering.",
  "Discipline is the architecture of luxury. Build deliberately.",
  "Make today undeniable — in craft, in presence, in execution.",
];

const INDUSTRY_TO_TRACK: Record<IndustryId, string> = {
  yachts: "yachting",
  villas: "property",
  jets: "aviation",
  cars: "automotive",
};

type CalendarEvent = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  industry: IndustryId;
  contentPrepWeeks: number;
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "boot-dusseldorf-2027",
    title: "boot Düsseldorf",
    location: "Düsseldorf, Germany",
    startDate: "2027-01-23",
    endDate: "2027-02-01",
    industry: "yachts",
    contentPrepWeeks: 4,
  },
  {
    id: "miami-boat-2027",
    title: "Miami International Boat Show",
    location: "Miami Beach, USA",
    startDate: "2027-02-11",
    endDate: "2027-02-17",
    industry: "yachts",
    contentPrepWeeks: 4,
  },
  {
    id: "dubai-boat-2027",
    title: "Dubai International Boat Show",
    location: "Dubai Marina, UAE",
    startDate: "2027-03-04",
    endDate: "2027-03-08",
    industry: "yachts",
    contentPrepWeeks: 4,
  },
  {
    id: "palm-beach-2027",
    title: "Palm Beach International Boat Show",
    location: "Palm Beach, USA",
    startDate: "2027-03-25",
    endDate: "2027-03-28",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "myba-2026",
    title: "MYBA Charter Show",
    location: "Sanremo, Italy",
    startDate: "2026-04-27",
    endDate: "2026-04-30",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "palma-boat-2026",
    title: "Palma International Boat Show",
    location: "Palma de Mallorca, Spain",
    startDate: "2026-04-29",
    endDate: "2026-05-02",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "medys-2026",
    title: "Mediterranean Yacht Show",
    location: "Nafplio, Greece",
    startDate: "2026-05-02",
    endDate: "2026-05-06",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "world-superyacht-awards-2026",
    title: "World Superyacht Awards",
    location: "Venice, Italy",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    industry: "yachts",
    contentPrepWeeks: 2,
  },
  {
    id: "venice-boat-2026",
    title: "Venice Boat Show",
    location: "Venice, Italy",
    startDate: "2026-05-01",
    endDate: "2026-05-03",
    industry: "yachts",
    contentPrepWeeks: 2,
  },
  {
    id: "tyba-2026",
    title: "TYBA Charter Show",
    location: "Gocek Marina, Turkey",
    startDate: "2026-05-07",
    endDate: "2026-05-11",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "superyacht-design-fest-2026",
    title: "Superyacht Design Festival",
    location: "Kitzbuhel, Austria",
    startDate: "2026-06-15",
    endDate: "2026-06-17",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "newport-charter-2026",
    title: "Newport Charter Yacht Show",
    location: "Newport, USA",
    startDate: "2026-06-22",
    endDate: "2026-06-25",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "cyf-2026",
    title: "Cannes Yachting Festival",
    location: "Cannes, France",
    startDate: "2026-09-08",
    endDate: "2026-09-13",
    industry: "yachts",
    contentPrepWeeks: 4,
  },
  {
    id: "mys-2026",
    title: "Monaco Yacht Show",
    location: "Port Hercule, Monaco",
    startDate: "2026-09-23",
    endDate: "2026-09-26",
    industry: "yachts",
    contentPrepWeeks: 6,
  },
  {
    id: "croya-2026",
    title: "CROYA Charter Show",
    location: "Antibes, France",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "flibs-2026",
    title: "Fort Lauderdale Boat Show",
    location: "Fort Lauderdale, USA",
    startDate: "2026-10-28",
    endDate: "2026-11-01",
    industry: "yachts",
    contentPrepWeeks: 4,
  },
  {
    id: "usvi-charter-2026",
    title: "USVI Charter Yacht Show",
    location: "St Thomas, USVI",
    startDate: "2026-11-05",
    endDate: "2026-11-08",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "metstrade-2026",
    title: "Metstrade",
    location: "Amsterdam, Netherlands",
    startDate: "2026-11-17",
    endDate: "2026-11-19",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "explorer-summit-2026",
    title: "Explorer Yachts Summit",
    location: "Amsterdam, Netherlands",
    startDate: "2026-11-16",
    endDate: "2026-11-16",
    industry: "yachts",
    contentPrepWeeks: 2,
  },
  {
    id: "antigua-charter-2026",
    title: "Antigua Charter Yacht Show",
    location: "Antigua, Caribbean",
    startDate: "2026-12-04",
    endDate: "2026-12-09",
    industry: "yachts",
    contentPrepWeeks: 3,
  },
  {
    id: "rise-expo-2027",
    title: "RISE Expo Dubai",
    location: "Dubai, UAE",
    startDate: "2027-01-13",
    endDate: "2027-01-15",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "mipim-2027",
    title: "MIPIM",
    location: "Cannes, France",
    startDate: "2027-03-15",
    endDate: "2027-03-19",
    industry: "villas",
    contentPrepWeeks: 6,
  },
  {
    id: "knight-frank-2026",
    title: "Knight Frank Wealth Report Launch",
    location: "London, UK",
    startDate: "2026-03-04",
    endDate: "2026-03-04",
    industry: "villas",
    contentPrepWeeks: 1,
  },
  {
    id: "sothebys-realty-2026",
    title: "Sotheby's International Realty Summit",
    location: "Miami, USA",
    startDate: "2026-03-10",
    endDate: "2026-03-12",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "gulf-re-awards-2026",
    title: "Gulf Real Estate Awards",
    location: "Dubai, UAE",
    startDate: "2026-04-15",
    endDate: "2026-04-16",
    industry: "villas",
    contentPrepWeeks: 2,
  },
  {
    id: "milken-2026",
    title: "Milken Institute Global Conference",
    location: "Beverly Hills, USA",
    startDate: "2026-05-04",
    endDate: "2026-05-07",
    industry: "villas",
    contentPrepWeeks: 4,
  },
  {
    id: "christies-re-2026",
    title: "Christie's International Real Estate Summit",
    location: "New York, USA",
    startDate: "2026-05-05",
    endDate: "2026-05-06",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "cannes-lions-2026",
    title: "Cannes Lions",
    location: "Cannes, France",
    startDate: "2026-06-22",
    endDate: "2026-06-26",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "inman-luxury-2026",
    title: "Inman Luxury Connect",
    location: "San Diego, USA",
    startDate: "2026-07-27",
    endDate: "2026-07-28",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "rics-2026",
    title: "RICS World Built Environment Forum",
    location: "London, UK",
    startDate: "2026-09-14",
    endDate: "2026-09-15",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "palexpo-2026",
    title: "Salon International de l'Immobilier",
    location: "Geneva, Switzerland",
    startDate: "2026-09-24",
    endDate: "2026-09-27",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "expo-real-2026",
    title: "Expo Real Munich",
    location: "Munich, Germany",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    industry: "villas",
    contentPrepWeeks: 4,
  },
  {
    id: "uli-2026",
    title: "ULI Fall Meeting",
    location: "Las Vegas, USA",
    startDate: "2026-10-19",
    endDate: "2026-10-22",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "world-luxury-expo-2026",
    title: "World Luxury Expo",
    location: "Abu Dhabi, UAE",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "cityscape-dubai-2026",
    title: "Cityscape Dubai",
    location: "Dubai, UAE",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    industry: "villas",
    contentPrepWeeks: 4,
  },
  {
    id: "monaco-property-2026",
    title: "Monaco Property Days",
    location: "Monaco",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "sime-miami-2026",
    title: "SIME Miami",
    location: "Miami, USA",
    startDate: "2026-11-18",
    endDate: "2026-11-20",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "iltm-2026",
    title: "ILTM Cannes",
    location: "Cannes, France",
    startDate: "2026-11-30",
    endDate: "2026-12-03",
    industry: "villas",
    contentPrepWeeks: 4,
  },
  {
    id: "leading-re-2027",
    title: "LeadingRE Luxury Summit",
    location: "Las Vegas, USA",
    startDate: "2027-03-22",
    endDate: "2027-03-24",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "dubai-property-2027",
    title: "Dubai Luxury Property Show",
    location: "Dubai, UAE",
    startDate: "2027-02-20",
    endDate: "2027-02-22",
    industry: "villas",
    contentPrepWeeks: 3,
  },
  {
    id: "nac-2026",
    title: "NAFA Aviation Forum",
    location: "Miami, USA",
    startDate: "2026-02-10",
    endDate: "2026-02-12",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "asian-biz-av-2026",
    title: "Asian Business Aviation Conference",
    location: "Shanghai, China",
    startDate: "2026-03-24",
    endDate: "2026-03-26",
    industry: "jets",
    contentPrepWeeks: 4,
  },
  {
    id: "avbuyer-2026",
    title: "AvBuyer Aircraft Summit",
    location: "London, UK",
    startDate: "2026-03-17",
    endDate: "2026-03-18",
    industry: "jets",
    contentPrepWeeks: 2,
  },
  {
    id: "aero-2026",
    title: "AERO Friedrichshafen",
    location: "Friedrichshafen, Germany",
    startDate: "2026-04-15",
    endDate: "2026-04-18",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "canbiz-2026",
    title: "CANBIZ Cannes",
    location: "Cannes, France",
    startDate: "2026-04-07",
    endDate: "2026-04-09",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "corporate-jet-investor-2026",
    title: "Corporate Jet Investor",
    location: "New York, USA",
    startDate: "2026-04-28",
    endDate: "2026-04-29",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "ebace-2026",
    title: "EBACE Geneva",
    location: "Geneva, Switzerland",
    startDate: "2026-05-19",
    endDate: "2026-05-21",
    industry: "jets",
    contentPrepWeeks: 4,
  },
  {
    id: "cahf-2026",
    title: "Corporate Aviation Hospitality Forum",
    location: "Monaco",
    startDate: "2026-06-04",
    endDate: "2026-06-05",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "baa-2026",
    title: "BBGA Forum",
    location: "London, UK",
    startDate: "2026-06-09",
    endDate: "2026-06-10",
    industry: "jets",
    contentPrepWeeks: 2,
  },
  {
    id: "farnborough-2026",
    title: "Farnborough Airshow",
    location: "Farnborough, UK",
    startDate: "2026-07-20",
    endDate: "2026-07-26",
    industry: "jets",
    contentPrepWeeks: 5,
  },
  {
    id: "aviation-festival-2026",
    title: "Aviation Festival",
    location: "Amsterdam, Netherlands",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "jetexpo-2026",
    title: "JetExpo",
    location: "Moscow, Russia",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "wjet-2026",
    title: "World Jet Forum",
    location: "Geneva, Switzerland",
    startDate: "2026-10-06",
    endDate: "2026-10-07",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "rotorcraft-2026",
    title: "Rotorcraft Pro Summit",
    location: "Las Vegas, USA",
    startDate: "2026-10-19",
    endDate: "2026-10-19",
    industry: "jets",
    contentPrepWeeks: 2,
  },
  {
    id: "nbaa-2026",
    title: "NBAA-BACE",
    location: "Las Vegas, USA",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    industry: "jets",
    contentPrepWeeks: 6,
  },
  {
    id: "charter-broker-2026",
    title: "Air Charter Association Summit",
    location: "London, UK",
    startDate: "2026-11-03",
    endDate: "2026-11-04",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "mebaa-2026",
    title: "MEBAA Show",
    location: "Dubai, UAE",
    startDate: "2026-12-08",
    endDate: "2026-12-10",
    industry: "jets",
    contentPrepWeeks: 4,
  },
  {
    id: "heli-expo-2027",
    title: "HAI Heli-Expo",
    location: "Dallas, USA",
    startDate: "2027-03-06",
    endDate: "2027-03-09",
    industry: "jets",
    contentPrepWeeks: 3,
  },
  {
    id: "dubai-airshow-2027",
    title: "Dubai Airshow",
    location: "Dubai, UAE",
    startDate: "2027-11-17",
    endDate: "2027-11-21",
    industry: "jets",
    contentPrepWeeks: 6,
  },
  {
    id: "retromobile-2027",
    title: "Retromobile",
    location: "Paris, France",
    startDate: "2027-02-03",
    endDate: "2027-02-08",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "amelia-island-2026",
    title: "Amelia Island Concours",
    location: "Amelia Island, USA",
    startDate: "2026-03-05",
    endDate: "2026-03-08",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "goodwood-members-2026",
    title: "Goodwood Members' Meeting",
    location: "Goodwood, UK",
    startDate: "2026-04-18",
    endDate: "2026-04-19",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "top-marques-2026",
    title: "Top Marques Monaco",
    location: "Monaco",
    startDate: "2026-05-06",
    endDate: "2026-05-10",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "villa-deste-2026",
    title: "Concorso d'Eleganza Villa d'Este",
    location: "Lake Como, Italy",
    startDate: "2026-05-15",
    endDate: "2026-05-17",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "rm-monaco-2026",
    title: "RM Sotheby's Monaco",
    location: "Monaco",
    startDate: "2026-05-20",
    endDate: "2026-05-21",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "le-mans-classic-2026",
    title: "Le Mans Classic",
    location: "Le Mans, France",
    startDate: "2026-07-03",
    endDate: "2026-07-06",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "goodwood-fos-2026",
    title: "Goodwood Festival of Speed",
    location: "Goodwood, UK",
    startDate: "2026-07-09",
    endDate: "2026-07-12",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "rm-monterey-2026",
    title: "RM Sotheby's Monterey",
    location: "Pebble Beach, USA",
    startDate: "2026-08-12",
    endDate: "2026-08-12",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "quail-2026",
    title: "The Quail Motorsports Gathering",
    location: "Carmel, USA",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    industry: "cars",
    contentPrepWeeks: 4,
  },
  {
    id: "pebble-beach-2026",
    title: "Pebble Beach Concours",
    location: "Pebble Beach, USA",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    industry: "cars",
    contentPrepWeeks: 6,
  },
  {
    id: "concorso-italiano-2026",
    title: "Concorso Italiano",
    location: "Monterey, USA",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "salon-prive-2026",
    title: "Salon Prive",
    location: "Blenheim Palace, UK",
    startDate: "2026-09-02",
    endDate: "2026-09-05",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "goodwood-revival-2026",
    title: "Goodwood Revival",
    location: "Goodwood, UK",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "paris-motor-2026",
    title: "Paris Motor Show",
    location: "Paris, France",
    startDate: "2026-10-15",
    endDate: "2026-10-25",
    industry: "cars",
    contentPrepWeeks: 5,
  },
  {
    id: "rm-london-2026",
    title: "RM Sotheby's London",
    location: "London, UK",
    startDate: "2026-10-31",
    endDate: "2026-10-31",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "bonhams-scottsdale-2027",
    title: "Bonhams Scottsdale Auction",
    location: "Scottsdale, USA",
    startDate: "2027-01-16",
    endDate: "2027-01-16",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "cavallino-2027",
    title: "Cavallino Classic",
    location: "Palm Beach, USA",
    startDate: "2027-01-22",
    endDate: "2027-01-26",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "artcurial-2027",
    title: "Artcurial Retromobile Auction",
    location: "Paris, France",
    startDate: "2027-02-05",
    endDate: "2027-02-06",
    industry: "cars",
    contentPrepWeeks: 3,
  },
  {
    id: "ice-st-moritz-2027",
    title: "The I.C.E. St. Moritz",
    location: "St. Moritz, Switzerland",
    startDate: "2027-02-14",
    endDate: "2027-02-14",
    industry: "cars",
    contentPrepWeeks: 3,
  },
];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function isoDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function weekStartIso(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getUTCDay();
  const diff = (day + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - diff);
  return dt.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { industry, industryId, setIndustry } = useIndustry();
  const { session, user } = useAuth();
  const isDemo = !session;
  const now = useNow();
  const [profileName, setProfileName] = useState<string | null>(null);
  const { state: core, update: updateCore } = useAurumCoreState();
  const { profile: userProfile } = useUserProfile();

  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<string[]>(industry.dailyObjectives);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});

  const recFn = useServerFn(generateRecommendation);
  const tasksFn = useServerFn(generateDailyTasks);

  const todayStr = isoDay();
  const upcomingEvents = CALENDAR_EVENTS.filter((e) => e.industry === industryId && e.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      date: new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      title: e.title,
      daysUntil: Math.ceil((new Date(e.startDate).getTime() - new Date(todayStr).getTime()) / 86_400_000),
    }));

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setProfileName((data as { full_name: string | null } | null)?.full_name ?? null);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !core) return;
    const c = core;
    const summary = c.ai_summary as { recommendation?: string; mode?: string } | null;
    const ctx = {
      mode: industry.label,
      level: c.current_level ?? undefined,
      goal: typeof c.current_focus === "string" ? c.current_focus : undefined,
      streak: c.streak,
      phase: industry.phaseLabel,
      taskCount: userProfile?.daily_task_count ?? 5,
    };

    const recStale =
      !summary?.recommendation ||
      !c.ai_summary_updated_at ||
      Date.now() - new Date(c.ai_summary_updated_at).getTime() > 86_400_000 ||
      summary?.mode !== industry.label;
    if (recStale) {
      refreshRecommendation(ctx);
    } else {
      setRecommendation(summary?.recommendation ?? null);
    }

    const cachedTasks = c.daily_tasks as any;
    if (cachedTasks?.tasks?.length > 0 && c.daily_tasks_date === isoDay() && cachedTasks?.mode === industry.label) {
      setDailyTasks(cachedTasks.tasks);
    } else {
      refreshDailyTasks(ctx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, industryId, core?.id, industry.label]);

  async function toggle(i: number) {
    const wasDone = !!done[i];
    setDone((d) => ({ ...d, [i]: !d[i] }));
    if (wasDone || !user) return;
    const today = isoDay();
    const STREAK_KEY = `aurum:lastStreakDate:${user.id}`;
    const last = typeof window !== "undefined" ? localStorage.getItem(STREAK_KEY) : null;
    let nextStreak = core?.streak ?? 0;
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      nextStreak = last === yesterday ? nextStreak + 1 : 1;
      if (typeof window !== "undefined") localStorage.setItem(STREAK_KEY, today);
    }
    // Write to aurum_tasks table
    await (supabase as any).from("aurum_tasks").insert({
      user_id: user.id,
      title: dailyTasks[i],
      status: "completed",
      priority: "medium",
      source: "daily_ritual",
    });
    // Update core state
    await updateCore({
      execution_score: (core?.execution_score ?? 0) + 1,
      streak: nextStreak,
    });
  }

  async function refreshRecommendation(ctx: {
    mode: string;
    level?: string;
    goal?: string;
    streak?: number;
    phase?: string;
  }) {
    if (!user) return;
    setRecLoading(true);
    try {
      const { recommendation: text } = await recFn({ data: ctx });
      setRecommendation(text);
      await updateCore({
        ai_summary: { recommendation: text, mode: industry.label },
        ai_summary_updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setRecLoading(false);
    }
  }

  async function refreshDailyTasks(ctx: {
    mode: string;
    level?: string;
    goal?: string;
    streak?: number;
    phase?: string;
    taskCount?: number;
  }) {
    if (!user) return;
    setTasksLoading(true);
    try {
      const { tasks } = await tasksFn({ data: ctx });
      setDailyTasks(tasks);
      setDone({});
      await updateCore({
        daily_tasks: { mode: industry.label, tasks } as any,
        daily_tasks_date: isoDay(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  }

  const completed = dailyTasks.filter((_, i) => done[i]).length;
  const total = dailyTasks.length || 1;

  const welcome = useMemo(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
    return WELCOMES[dayOfYear % WELCOMES.length];
  }, [now]);

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateLong = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const hubs = INDUSTRY_LIST.map((m) => ({
    ...m,
    active: m.id === industryId,
    nextEvent: m.upcoming[0],
  }));

  const hospitality = {
    id: "hospitality" as const,
    label: "Hospitality",
    modeLabel: "Hospitality Mode",
    icon: Hotel,
    ambientImage: INDUSTRY_LIST[1].ambientImage,
  };

  return (
    <AppShell>
      {isDemo && (
        <div className="mb-6 flex items-center justify-between gap-4 glass rounded-xl px-4 sm:px-5 py-3 border border-primary/20 animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.32em] text-primary/80 uppercase">Demo mode</div>
              <div className="text-sm text-foreground/90 truncate">
                Sign in to unlock the full experience — memory, persistence, unlimited AI.
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs tracking-wide text-primary-foreground shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            Sign in
          </Link>
        </div>
      )}

      <header className="mb-12 sm:mb-16 animate-fade-up">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
          <div>
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
              <div className="text-[10px] tracking-[0.4em] text-primary/70 uppercase">
                {dayName} · {dateLong}
              </div>
              <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground lg:hidden">{timeStr}</div>
            </div>
            <h1 className="font-serif text-[34px] sm:text-[52px] leading-[1.05] tracking-tight">
              Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"},
              <br />
              <span className="text-gold-gradient italic">
                {profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operator"}.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">{welcome}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/mentor"
                className="inline-flex items-center gap-2 text-primary-foreground rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-gold)]"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Sparkles className="h-4 w-4 text-primary-foreground" /> Speak with AURUM
              </Link>
              <Link
                to="/intelligence"
                className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 text-sm border border-border/60 hover:border-primary/50 transition-colors"
              >
                <Radio className="h-4 w-4 text-primary" /> Open Intelligence
              </Link>
            </div>
          </div>
          <aside className="hidden lg:flex flex-col gap-3 items-end">
            <div className="font-mono text-xs tracking-[0.3em] text-muted-foreground">{timeStr}</div>
            <GlobalTimeHub compact />
          </aside>
        </div>
        <div className="mt-8 lg:hidden">
          <GlobalTimeHub compact />
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <section className="lg:col-span-2 space-y-6 lg:space-y-8">
          <Card>
            <CardHeader
              eyebrow={`TODAY · ${industry.modeLabel.toUpperCase()}`}
              title="Daily ritual"
              meta={tasksLoading ? "…" : `${completed} of ${total}`}
            />
            <div className="space-y-1.5">
              {dailyTasks.map((t, i) => {
                const isDone = !!done[i];
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`group w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${isDone ? "bg-secondary/20" : "hover:bg-secondary/40"}`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${isDone ? "bg-primary border-primary" : "border-border/70 group-hover:border-primary/60"}`}
                    >
                      {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div
                      className={`flex-1 text-[15px] leading-snug ${isDone ? "text-muted-foreground/70 line-through" : "text-foreground"}`}
                    >
                      {t}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 h-px w-full bg-border/40 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--gradient-gold)] transition-all duration-500"
                style={{ width: `${(completed / total) * 100}%`, height: "1px" }}
              />
            </div>
            <div className="mt-3 text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
              Momentum · {Math.round((completed / total) * 100)}%
            </div>
          </Card>

          <div>
            <SubHeading eyebrow="ACADEMY" title="Your tracks" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {hubs.map((m) => {
                const Icon = m.icon;
                const trackSlug = INDUSTRY_TO_TRACK[m.id];
                return (
                  <Link
                    key={m.id}
                    to="/academy"
                    search={{ track: trackSlug }}
                    className={`group relative aspect-[4/5] rounded-xl overflow-hidden border transition-all text-left block ${m.active ? "border-primary/60 ring-1 ring-primary/30" : "border-border/60 hover:border-primary/40"}`}
                  >
                    <img
                      src={m.ambientImage}
                      alt={m.label}
                      className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="relative h-full p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Icon className="h-4 w-4 text-primary/90" />
                        {m.active && <span className="text-[8px] tracking-[0.3em] text-primary/90">LIVE</span>}
                      </div>
                      <div>
                        <div className="font-serif text-lg leading-tight">{m.label}</div>
                        <div className="mt-1 text-[10px] tracking-wider text-muted-foreground uppercase">
                          {m.trackProgress}/{m.trackModules} complete
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border/40 opacity-60">
                <img
                  src={hospitality.ambientImage}
                  alt={hospitality.label}
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="relative h-full p-4 flex flex-col justify-between">
                  <Hotel className="h-4 w-4 text-primary/70" />
                  <div>
                    <div className="font-serif text-lg leading-tight">Hospitality</div>
                    <div className="mt-1 text-[10px] tracking-wider text-muted-foreground uppercase">Arriving soon</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:space-y-8">
          <Card accent>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-primary/80">AURUM RECOMMENDS</div>
              {recLoading && <RefreshCw className="h-3 w-3 text-primary/60 animate-spin ml-auto" />}
            </div>
            <p className="font-serif text-[20px] leading-snug">"{recommendation || industry.aiRecommendation}"</p>
            <button
              className="mt-5 w-full text-sm rounded-full py-2.5 text-primary-foreground shadow-[var(--shadow-gold)]"
              style={{ background: "var(--gradient-gold)" }}
            >
              Generate outreach
            </button>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="text-[10px] tracking-[0.34em] text-foreground">UPCOMING</div>
              </div>
              <Link
                to="/calendar"
                className="text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
              >
                {upcomingEvents.length} · View all
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((ev) => (
                <Link key={ev.id} to="/calendar" className="group flex items-start gap-4 cursor-pointer">
                  <div className="shrink-0 w-12">
                    <div className="font-mono text-[10px] tracking-widest text-primary/80 uppercase">{ev.date}</div>
                    {ev.daysUntil <= 14 && <div className="text-[9px] text-primary/60 mt-0.5">{ev.daysUntil}d</div>}
                  </div>
                  <div className="flex-1 text-[14px] leading-snug text-foreground/90 group-hover:text-primary transition-colors">
                    {ev.title}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-xs text-muted-foreground italic">No upcoming events found.</div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Compass className="h-4 w-4 text-primary" />
              <div className="text-[10px] tracking-[0.34em] text-foreground">PROGRESSION</div>
            </div>
            <div className="font-serif text-2xl">Initiate II</div>
            <div className="text-[12px] text-muted-foreground mt-1">Phase 02 · {industry.modeLabel}</div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
                <span>NEXT TIER</span>
                <span>67%</span>
              </div>
              <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--gradient-gold)] rounded-full" style={{ width: "67%" }} />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-5 gap-1.5">
              {["Initiate", "Operator", "Insider", "Counsel", "Aurum"].map((tier, i) => (
                <div key={tier} className="text-center">
                  <div
                    className={`h-1.5 w-full rounded-full ${i <= 1 ? "bg-[var(--gradient-gold)]" : "bg-border/40"}`}
                  />
                  <div
                    className={`mt-2 text-[9px] tracking-wider uppercase ${i <= 1 ? "text-foreground/80" : "text-muted-foreground/60"}`}
                  >
                    {tier}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`relative glass rounded-2xl p-6 sm:p-7 overflow-hidden ${accent ? "ring-gold" : ""}`}>
      {accent && <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-[0.04] pointer-events-none" />}
      <div className="relative">{children}</div>
    </div>
  );
}

function CardHeader({ eyebrow, title, meta }: { eyebrow: string; title: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5 gap-4">
      <div>
        <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{eyebrow}</div>
        <h2 className="font-serif text-xl sm:text-[22px] leading-tight">{title}</h2>
      </div>
      {meta && <div className="text-xs text-muted-foreground font-mono shrink-0">{meta}</div>}
    </div>
  );
}

function SubHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{eyebrow}</div>
      <h2 className="font-serif text-xl sm:text-[22px] leading-tight">{title}</h2>
    </div>
  );
}
