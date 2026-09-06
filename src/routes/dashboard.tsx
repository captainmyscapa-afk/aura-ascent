import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Check, Calendar, Compass, Radio, ChevronRight, ChevronDown, Lock, RefreshCw, MapPin, ChevronLeft, Clock, Flame } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/aurum/AppShell";
import { AnimateIn } from "@/components/aurum/AnimateIn";
import { GlobalTimeHub } from "@/components/aurum/GlobalTimeHub";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import type { IndustryId } from "@/lib/industry/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAurumCoreState, type RitualProfile } from "@/hooks/useAurumCoreState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateRecommendation, generateDailyTasks } from "@/lib/identity.functions";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/aurum/UpgradeModal";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { celebrate } from "@/lib/celebration";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

// Curated so the celebration fires at meaningful gaps, not every single day.
const STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365];

// CAP-123: same dot+label badge shown on every ritual/roadmap item elsewhere
// in the app (see INDUSTRY_META in calendar.tsx) — restores it to the
// Dashboard's own Daily Ritual list, which had dropped it.
const RITUAL_BADGE: Record<string, { dot: string; text: string; label: string }> = {
  yachts: { dot: "bg-blue-400", text: "text-blue-300", label: "Yacht" },
  villas: { dot: "bg-emerald-400", text: "text-emerald-300", label: "Villa" },
  jets: { dot: "bg-violet-400", text: "text-violet-300", label: "Jet" },
  cars: { dot: "bg-orange-400", text: "text-orange-300", label: "Car" },
};

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
  description?: string;
  url?: string;
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "boot-dusseldorf-2027", title: "boot Düsseldorf", location: "Düsseldorf, Germany", startDate: "2027-01-23", endDate: "2027-02-01", industry: "yachts", description: "The world's largest indoor boat show. 1,500+ exhibitors, 214,000 visitors across 16 halls. Premier European networking event.", contentPrepWeeks: 4, url: "https://www.boot.de" },
  { id: "miami-boat-2027", title: "Miami International Boat Show", location: "Miami Beach, USA", startDate: "2027-02-11", endDate: "2027-02-17", industry: "yachts", description: "100,000+ visitors, largest motor yacht showcase in the Americas. Critical for US charter market networking.", contentPrepWeeks: 4, url: "https://www.miamiboatshow.com" },
  { id: "dubai-boat-2027", title: "Dubai International Boat Show", location: "Dubai Marina, UAE", startDate: "2027-03-04", endDate: "2027-03-08", industry: "yachts", description: "Middle East's premier marine event. 1,000+ brands, 200+ boats. Key for UHNW Middle Eastern buyer relationships.", contentPrepWeeks: 4, url: "https://www.dubaiboatshow.com" },
  { id: "palm-beach-2027", title: "Palm Beach International Boat Show", location: "Palm Beach, USA", startDate: "2027-03-25", endDate: "2027-03-28", industry: "yachts", description: "Exclusive boutique show attracting the right clientele. Superyachts along Flagler Drive in a curated setting.", contentPrepWeeks: 3, url: "https://www.pbboatshow.com" },
  { id: "myba-2026", title: "MYBA Charter Show", location: "Sanremo, Italy", startDate: "2026-04-27", endDate: "2026-04-30", industry: "yachts", description: "Trade-only charter show marking the start of the Mediterranean season. 500+ exhibitors, 80+ yachts from 16-90m.", contentPrepWeeks: 3, url: "https://www.mybashow.com" },
  { id: "palma-boat-2026", title: "Palma International Boat Show", location: "Palma de Mallorca, Spain", startDate: "2026-04-29", endDate: "2026-05-02", industry: "yachts", description: "Strategic pre-season show. Superyacht Village showcases 24m+ vessels. Ideal for charter and brokerage mandates.", contentPrepWeeks: 3, url: "https://www.palmainternationalboatshow.com" },
  { id: "medys-2026", title: "Mediterranean Yacht Show", location: "Nafplio, Greece", startDate: "2026-05-02", endDate: "2026-05-06", industry: "yachts", description: "The world's largest crewed charter show. Focus on fleet quality and crew standards ahead of the Med season.", contentPrepWeeks: 3, url: "https://www.mediterraneanyachtshow.gr" },
  { id: "world-superyacht-awards-2026", title: "World Superyacht Awards", location: "Venice, Italy", startDate: "2026-05-01", endDate: "2026-05-02", industry: "yachts", description: "The most prestigious awards in yachting. Industry leaders, shipyards, and designers gathered in Venice.", contentPrepWeeks: 2, url: "https://www.boatinternational.com" },
  { id: "venice-boat-2026", title: "Venice Boat Show", location: "Venice, Italy", startDate: "2026-05-01", endDate: "2026-05-03", industry: "yachts", description: "Boutique Italian show in a unique setting. Charter and brokerage networking against Venice iconic backdrop.", contentPrepWeeks: 2 },
  { id: "tyba-2026", title: "TYBA Charter Show", location: "Gocek Marina, Turkey", startDate: "2026-05-07", endDate: "2026-05-11", industry: "yachts", description: "Leading Eastern Mediterranean charter show. Turkish Riviera fleet showcase for Aegean season mandates.", contentPrepWeeks: 3, url: "https://www.tybachartershow.com" },
  { id: "superyacht-design-fest-2026", title: "Superyacht Design Festival", location: "Kitzbuhel, Austria", startDate: "2026-06-15", endDate: "2026-06-17", industry: "yachts", description: "Two-day event bringing together superyacht industry leaders and luxury community for talks and networking.", contentPrepWeeks: 3, url: "https://www.boatinternational.com" },
  { id: "newport-charter-2026", title: "Newport Charter Yacht Show", location: "Newport, Rhode Island, USA", startDate: "2026-06-22", endDate: "2026-06-25", industry: "yachts", description: "East Coast premier charter show. Brokers and UHNW clients inspect summer charter fleet in New England.", contentPrepWeeks: 3 },
  { id: "cyf-2026", title: "Cannes Yachting Festival", location: "Cannes, France", startDate: "2026-09-08", endDate: "2026-09-13", industry: "yachts", description: "Europe largest in-water boat show. 700+ yachts, 50,000 visitors. Essential for charter and brokerage networking.", contentPrepWeeks: 4, url: "https://www.cannesyachtingfestival.com" },
  { id: "mys-2026", title: "Monaco Yacht Show", location: "Port Hercule, Monaco", startDate: "2026-09-23", endDate: "2026-09-26", industry: "yachts", description: "The world premier superyacht event. 120+ superyachts, 560 exhibitors. The most important week in brokerage.", contentPrepWeeks: 6, url: "https://www.monacoyachtshow.com" },
  { id: "croya-2026", title: "CROYA Charter Show", location: "Antibes, France", startDate: "2026-10-05", endDate: "2026-10-07", industry: "yachts", description: "Cote Azur charter show bridging summer and winter seasons. French Riviera brokers and UHNW clients.", contentPrepWeeks: 3 },
  { id: "flibs-2026", title: "Fort Lauderdale Boat Show", location: "Fort Lauderdale, USA", startDate: "2026-10-28", endDate: "2026-11-01", industry: "yachts", description: "The world largest in-water boat show. $4B+ in yachts across 6 miles of floating docks.", contentPrepWeeks: 4, url: "https://www.flibs.com" },
  { id: "usvi-charter-2026", title: "USVI Charter Yacht Show", location: "St Thomas, US Virgin Islands", startDate: "2026-11-05", endDate: "2026-11-08", industry: "yachts", description: "Premier Caribbean charter show. Brokers evaluate yachts ahead of winter season in a tropical setting.", contentPrepWeeks: 3 },
  { id: "metstrade-2026", title: "Metstrade", location: "Amsterdam, Netherlands", startDate: "2026-11-17", endDate: "2026-11-19", industry: "yachts", description: "World largest marine equipment trade show. 1,700 exhibitors, Superyacht Forum. Essential for refit professionals.", contentPrepWeeks: 3, url: "https://www.metstrade.com" },
  { id: "explorer-summit-2026", title: "Explorer Yachts Summit", location: "Amsterdam, Netherlands", startDate: "2026-11-16", endDate: "2026-11-16", industry: "yachts", description: "The only international summit dedicated to explorer yachting. Owners, captains and adventurers on one stage.", contentPrepWeeks: 2, url: "https://www.boatinternational.com" },
  { id: "antigua-charter-2026", title: "Antigua Charter Yacht Show", location: "Antigua, Caribbean", startDate: "2026-12-04", endDate: "2026-12-09", industry: "yachts", description: "Industry-only show at Nelson Dockyard. Opens the Caribbean charter season. Key for winter mandate pipeline.", contentPrepWeeks: 3 },
  { id: "rise-expo-2027", title: "RISE Expo Dubai", location: "Dubai, UAE", startDate: "2027-01-13", endDate: "2027-01-15", industry: "villas", description: "Real estate and investments expo. Trophy developers and UHNW investors in the Gulf premier market.", contentPrepWeeks: 3 },
  { id: "mipim-2027", title: "MIPIM", location: "Cannes, France", startDate: "2027-03-15", endDate: "2027-03-19", industry: "villas", description: "The world premier real estate event. 20,000+ professionals, 90 countries. Trophy deals and UHNW investor meetings.", contentPrepWeeks: 6, url: "https://www.mipim.com" },
  { id: "knight-frank-2026", title: "Knight Frank Wealth Report Launch", location: "London, UK", startDate: "2026-03-04", endDate: "2026-03-04", industry: "villas", description: "Annual ultra-prime market intelligence launch. Sets the narrative for UHNW real estate investment globally.", contentPrepWeeks: 1, url: "https://www.knightfrank.com" },
  { id: "sothebys-realty-2026", title: "Sotheby International Realty Summit", location: "Miami, USA", startDate: "2026-03-10", endDate: "2026-03-12", industry: "villas", description: "Global luxury broker summit. Ultra-prime market intelligence and UHNW referral network building.", contentPrepWeeks: 3, url: "https://www.sothebysrealty.com" },
  { id: "gulf-re-awards-2026", title: "Gulf Real Estate Awards", location: "Dubai, UAE", startDate: "2026-04-15", endDate: "2026-04-16", industry: "villas", description: "Recognising excellence across Gulf trophy real estate. Developer principals and UHNW investor networking.", contentPrepWeeks: 2 },
  { id: "milken-2026", title: "Milken Institute Global Conference", location: "Beverly Hills, USA", startDate: "2026-05-04", endDate: "2026-05-07", industry: "villas", description: "The most influential investor and wealth forum globally. UHNW real estate deal flow and principal introductions.", contentPrepWeeks: 4, url: "https://www.milkeninstitute.org" },
  { id: "christies-re-2026", title: "Christie International Real Estate Summit", location: "New York, USA", startDate: "2026-05-05", endDate: "2026-05-06", industry: "villas", description: "Global luxury broker summit. Trophy property market intelligence and UHNW collector cross-referral network.", contentPrepWeeks: 3, url: "https://www.christiesrealestate.com" },
  { id: "cannes-lions-2026", title: "Cannes Lions", location: "Cannes, France", startDate: "2026-06-22", endDate: "2026-06-26", industry: "villas", description: "Global brand leadership festival. UHNW network overlap — luxury real estate visibility play for top brokers.", contentPrepWeeks: 3, url: "https://www.canneslions.com" },
  { id: "inman-luxury-2026", title: "Inman Luxury Connect", location: "San Diego, USA", startDate: "2026-07-27", endDate: "2026-07-28", industry: "villas", description: "Premier luxury real estate industry leadership forum. Top brokers, developers and UHNW market intelligence.", contentPrepWeeks: 3, url: "https://www.inman.com" },
  { id: "rics-2026", title: "RICS World Built Environment Forum", location: "London, UK", startDate: "2026-09-14", endDate: "2026-09-15", industry: "villas", description: "Global professional standards and prime market outlook. Key for positioning in ultra-prime UK and European markets.", contentPrepWeeks: 3, url: "https://www.rics.org" },
  { id: "palexpo-2026", title: "Salon International de Immobilier", location: "Geneva, Switzerland", startDate: "2026-09-24", endDate: "2026-09-27", industry: "villas", description: "Swiss international property salon. Ultra-prime Alpine, Monaco and Mediterranean listings for UHNW buyers.", contentPrepWeeks: 3 },
  { id: "expo-real-2026", title: "Expo Real Munich", location: "Munich, Germany", startDate: "2026-10-05", endDate: "2026-10-07", industry: "villas", description: "Europe leading real estate trade fair. 40,000+ attendees, 2,000+ exhibitors. Prime European market deals.", contentPrepWeeks: 4, url: "https://www.exporeal.net" },
  { id: "uli-2026", title: "ULI Fall Meeting", location: "Las Vegas, USA", startDate: "2026-10-19", endDate: "2026-10-22", industry: "villas", description: "Urban Land Institute annual gathering. Trophy development pipeline and prime market outlook for operators.", contentPrepWeeks: 3, url: "https://www.uli.org" },
  { id: "world-luxury-expo-2026", title: "World Luxury Expo", location: "Abu Dhabi, UAE", startDate: "2026-10-20", endDate: "2026-10-22", industry: "villas", description: "Invitation-only luxury exhibition for UHNW individuals. Trophy real estate, private aviation and fine art.", contentPrepWeeks: 3 },
  { id: "cityscape-dubai-2026", title: "Cityscape Dubai", location: "Dubai, UAE", startDate: "2026-11-10", endDate: "2026-11-12", industry: "villas", description: "MENA largest real estate event. Trophy developers, UHNW investors and branded residence launches.", contentPrepWeeks: 4, url: "https://www.cityscape.com" },
  { id: "monaco-property-2026", title: "Monaco Property Days", location: "Monaco", startDate: "2026-11-14", endDate: "2026-11-15", industry: "villas", description: "Private wealth managers and developer principals. Two-day ultra-prime market networking event.", contentPrepWeeks: 3 },
  { id: "sime-miami-2026", title: "SIME Miami", location: "Miami, USA", startDate: "2026-11-18", endDate: "2026-11-20", industry: "villas", description: "South Florida premier luxury real estate summit. Waterfront trophy properties and UHNW buyer mandates.", contentPrepWeeks: 3 },
  { id: "iltm-2026", title: "ILTM Cannes", location: "Cannes, France", startDate: "2026-11-30", endDate: "2026-12-03", industry: "villas", description: "International Luxury Travel Market. 85,000 pre-scheduled meetings. Branded residences and luxury hospitality deals.", contentPrepWeeks: 4, url: "https://www.iltm.com" },
  { id: "leading-re-2027", title: "LeadingRE Luxury Summit", location: "Las Vegas, USA", startDate: "2027-03-22", endDate: "2027-03-24", industry: "villas", description: "Leadership and luxury real estate summit. Top producing brokers and UHNW market strategy sessions.", contentPrepWeeks: 3, url: "https://www.leadingre.com" },
  { id: "dubai-property-2027", title: "Dubai Luxury Property Show", location: "Dubai, UAE", startDate: "2027-02-20", endDate: "2027-02-22", industry: "villas", description: "Trophy listings, Palm Jumeirah developers and branded residence teams. UHNW buyer pipeline event.", contentPrepWeeks: 3 },
  { id: "nac-2026", title: "NAFA Aviation Forum", location: "Miami, USA", startDate: "2026-02-10", endDate: "2026-02-12", industry: "jets", description: "Aviation finance and pre-owned market outlook. Key for understanding aircraft valuation cycles.", contentPrepWeeks: 3, url: "https://www.nafa.aero" },
  { id: "asian-biz-av-2026", title: "Asian Business Aviation Conference", location: "Shanghai, China", startDate: "2026-03-24", endDate: "2026-03-26", industry: "jets", description: "Asia Pacific premier business aviation event. UHNW Chinese and Asian buyer relationships and fleet orders.", contentPrepWeeks: 4, url: "https://www.abace.aero" },
  { id: "avbuyer-2026", title: "AvBuyer Aircraft Summit", location: "London, UK", startDate: "2026-03-17", endDate: "2026-03-18", industry: "jets", description: "Pre-owned aircraft market intelligence summit. Buyer and broker strategies for the current cycle.", contentPrepWeeks: 2, url: "https://www.avbuyer.com" },
  { id: "aero-2026", title: "AERO Friedrichshafen", location: "Friedrichshafen, Germany", startDate: "2026-04-15", endDate: "2026-04-18", industry: "jets", description: "Europe leading general aviation show. Private aircraft, avionics and operator networking.", contentPrepWeeks: 3, url: "https://www.aero-expo.com" },
  { id: "canbiz-2026", title: "CANBIZ Cannes", location: "Cannes, France", startDate: "2026-04-07", endDate: "2026-04-09", industry: "jets", description: "Boutique private aviation show on the Cote Azur. UHNW charter clients and Mediterranean operators.", contentPrepWeeks: 3 },
  { id: "corporate-jet-investor-2026", title: "Corporate Jet Investor", location: "New York, USA", startDate: "2026-04-28", endDate: "2026-04-29", industry: "jets", description: "Finance and investment forum for business aviation assets. Aircraft as investment vehicles — UHNW angle.", contentPrepWeeks: 3, url: "https://www.corporatejetinvestor.com" },
  { id: "ebace-2026", title: "EBACE Geneva", location: "Geneva, Switzerland", startDate: "2026-05-19", endDate: "2026-05-21", industry: "jets", description: "Europe premier business aviation event. OEMs, brokers, operators and UHNW buyers all in one place.", contentPrepWeeks: 4, url: "https://www.ebace.aero" },
  { id: "cahf-2026", title: "Corporate Aviation Hospitality Forum", location: "Monaco", startDate: "2026-06-04", endDate: "2026-06-05", industry: "jets", description: "Boutique aviation and UHNW hospitality crossover forum during Monaco Grand Prix week. Elite networking.", contentPrepWeeks: 3 },
  { id: "baa-2026", title: "BBGA Forum", location: "London, UK", startDate: "2026-06-09", endDate: "2026-06-10", industry: "jets", description: "UK business aviation industry forum. Regulatory updates, pre-owned market and operator networking.", contentPrepWeeks: 2, url: "https://www.bbga.aero" },
  { id: "farnborough-2026", title: "Farnborough Airshow", location: "Farnborough, UK", startDate: "2026-07-20", endDate: "2026-07-26", industry: "jets", description: "One of the world premier airshows. OEM launches, major aircraft orders and global aviation deal flow.", contentPrepWeeks: 5, url: "https://www.farnboroughairshow.com" },
  { id: "aviation-festival-2026", title: "Aviation Festival", location: "Amsterdam, Netherlands", startDate: "2026-09-08", endDate: "2026-09-09", industry: "jets", description: "Global aviation leadership summit. Airline executives, private operators and aviation technology leaders.", contentPrepWeeks: 3, url: "https://www.aviation-festival.com" },
  { id: "jetexpo-2026", title: "JetExpo", location: "Moscow, Russia", startDate: "2026-09-10", endDate: "2026-09-12", industry: "jets", description: "Eastern Europe leading business aviation show. Pre-owned inventory and charter fleet networking.", contentPrepWeeks: 3, url: "https://www.jetexpo.ru" },
  { id: "wjet-2026", title: "World Jet Forum", location: "Geneva, Switzerland", startDate: "2026-10-06", endDate: "2026-10-07", industry: "jets", description: "Elite private aviation conference. OEM executives, major brokers and UHNW fleet owners on one platform.", contentPrepWeeks: 3 },
  { id: "rotorcraft-2026", title: "Rotorcraft Pro Summit", location: "Las Vegas, USA", startDate: "2026-10-19", endDate: "2026-10-19", industry: "jets", description: "VIP helicopter and rotorcraft summit co-located with NBAA. UHNW short-range transport deal flow.", contentPrepWeeks: 2 },
  { id: "nbaa-2026", title: "NBAA-BACE", location: "Las Vegas, USA", startDate: "2026-10-20", endDate: "2026-10-22", industry: "jets", description: "The world most powerful business aviation event. 1,000+ exhibitors, 80+ aircraft on static display.", contentPrepWeeks: 6, url: "https://nbaa.org" },
  { id: "charter-broker-2026", title: "Air Charter Association Summit", location: "London, UK", startDate: "2026-11-03", endDate: "2026-11-04", industry: "jets", description: "Charter broker industry summit. Market intelligence, compliance updates and UHNW client acquisition strategies.", contentPrepWeeks: 3, url: "https://www.aircharterassociation.org" },
  { id: "mebaa-2026", title: "MEBAA Show", location: "Dubai, UAE", startDate: "2026-12-08", endDate: "2026-12-10", industry: "jets", description: "Middle East business aviation show. UHNW Gulf buyer relationships and fleet deals.", contentPrepWeeks: 4, url: "https://www.mebaa.aero" },
  { id: "heli-expo-2027", title: "HAI Heli-Expo", location: "Dallas, USA", startDate: "2027-03-06", endDate: "2027-03-09", industry: "jets", description: "World largest helicopter show. Charter operators, private owners and VIP transport specialists.", contentPrepWeeks: 3, url: "https://www.rotor.org" },
  { id: "dubai-airshow-2027", title: "Dubai Airshow", location: "Dubai, UAE", startDate: "2027-11-17", endDate: "2027-11-21", industry: "jets", description: "Middle East premier aerospace event. Private jets, OEM launches and UHNW buyer networking at scale.", contentPrepWeeks: 6, url: "https://www.dubaiairshow.aero" },
  { id: "retromobile-2027", title: "Retromobile", location: "Paris, France", startDate: "2027-02-03", endDate: "2027-02-08", industry: "cars", description: "Paris legendary winter collector car show. World rarest cars for sale and at auction. Opens the European season.", contentPrepWeeks: 4, url: "https://www.retromobile.com" },
  { id: "amelia-island-2026", title: "Amelia Island Concours", location: "Amelia Island, USA", startDate: "2026-03-05", endDate: "2026-03-08", industry: "cars", description: "Premier East Coast concours. $111M+ in collector cars auctioned. Broad Arrow and Gooding on-site.", contentPrepWeeks: 4, url: "https://www.ameliaconcours.com" },
  { id: "goodwood-members-2026", title: "Goodwood Members Meeting", location: "Goodwood, UK", startDate: "2026-04-18", endDate: "2026-04-19", industry: "cars", description: "Intimate invitation-only historic racing weekend. The most exclusive event in the Goodwood calendar.", contentPrepWeeks: 3, url: "https://www.goodwood.com" },
  { id: "top-marques-2026", title: "Top Marques Monaco", location: "Monaco", startDate: "2026-05-06", endDate: "2026-05-10", industry: "cars", description: "World most exclusive supercar show. New hypercar launches and ultra-luxury product debuts in Monaco.", contentPrepWeeks: 3, url: "https://www.topmarquesmonaco.com" },
  { id: "villa-deste-2026", title: "Concorso Eleganza Villa d Este", location: "Lake Como, Italy", startDate: "2026-05-15", endDate: "2026-05-17", industry: "cars", description: "The world most prestigious concours on Lake Como. Invitation-only. Collector and OEM networking at its finest.", contentPrepWeeks: 4, url: "https://www.bmw-groupclassiccars.com" },
  { id: "rm-monaco-2026", title: "RM Sotheby Monaco", location: "Monaco", startDate: "2026-05-20", endDate: "2026-05-21", industry: "cars", description: "Blue-chip automobile auction at Grimaldi Forum. Racing pedigree and iconic cars in the French Riviera setting.", contentPrepWeeks: 3, url: "https://rmsothebys.com" },
  { id: "le-mans-classic-2026", title: "Le Mans Classic", location: "Le Mans, France", startDate: "2026-07-03", endDate: "2026-07-06", industry: "cars", description: "Historic racers relive the 24 Hours. Artcurial auction on-site. Elite collector networking.", contentPrepWeeks: 4, url: "https://www.lemansclassic.com" },
  { id: "goodwood-fos-2026", title: "Goodwood Festival of Speed", location: "Goodwood, UK", startDate: "2026-07-09", endDate: "2026-07-12", industry: "cars", description: "The world greatest motorsport garden party. 200,000 attendees, new car launches, collector networking.", contentPrepWeeks: 4, url: "https://www.goodwood.com" },
  { id: "rm-monterey-2026", title: "RM Sotheby Monterey", location: "Pebble Beach, USA", startDate: "2026-08-12", endDate: "2026-08-12", industry: "cars", description: "Flagship collector car auction of Monterey Car Week. Trophy lots above $2M.", contentPrepWeeks: 4, url: "https://rmsothebys.com" },
  { id: "quail-2026", title: "The Quail Motorsports Gathering", location: "Carmel, USA", startDate: "2026-08-14", endDate: "2026-08-14", industry: "cars", description: "The most exclusive event of Monterey Car Week. Invitation-only. OEM debuts and UHNW collector networking.", contentPrepWeeks: 4, url: "https://www.quailmotorsportsgathering.com" },
  { id: "pebble-beach-2026", title: "Pebble Beach Concours", location: "Pebble Beach, USA", startDate: "2026-08-16", endDate: "2026-08-16", industry: "cars", description: "75th anniversary of the world premier collector car competition. Full week Aug 12-17.", contentPrepWeeks: 6, url: "https://www.pebblebeachconcours.net" },
  { id: "concorso-italiano-2026", title: "Concorso Italiano", location: "Monterey, USA", startDate: "2026-08-15", endDate: "2026-08-15", industry: "cars", description: "Celebrating Italian automotive excellence during Monterey Car Week. Ferrari, Lamborghini and Alfa collectors.", contentPrepWeeks: 3, url: "https://www.concorsoitaliano.com" },
  { id: "salon-prive-2026", title: "Salon Prive", location: "Blenheim Palace, UK", startDate: "2026-09-02", endDate: "2026-09-05", industry: "cars", description: "Britain most prestigious concours at Blenheim Palace. Invitation-only. Hypercar debuts and UHNW networking.", contentPrepWeeks: 3, url: "https://www.salonprivelondon.com" },
  { id: "goodwood-revival-2026", title: "Goodwood Revival", location: "Goodwood, UK", startDate: "2026-09-18", endDate: "2026-09-20", industry: "cars", description: "World greatest historic motor racing event. Period dress, classic cars and elite collector networking.", contentPrepWeeks: 3, url: "https://www.goodwood.com" },
  { id: "paris-motor-2026", title: "Paris Motor Show", location: "Paris, France", startDate: "2026-10-15", endDate: "2026-10-25", industry: "cars", description: "One of the world most prestigious motor shows. Hypercar launches, concept reveals and luxury brand debuts.", contentPrepWeeks: 5, url: "https://www.mondial.paris" },
  { id: "rm-london-2026", title: "RM Sotheby London", location: "London, UK", startDate: "2026-10-31", endDate: "2026-10-31", industry: "cars", description: "RM Sotheby flagship European sale. Trophy lots from 500K to 5M+. Key collector and broker networking.", contentPrepWeeks: 3, url: "https://rmsothebys.com" },
  { id: "bonhams-scottsdale-2027", title: "Bonhams Scottsdale Auction", location: "Scottsdale, USA", startDate: "2027-01-16", endDate: "2027-01-16", industry: "cars", description: "Opens the US collector car auction calendar. Blue-chip European classics and American muscle at auction.", contentPrepWeeks: 3, url: "https://www.bonhams.com" },
  { id: "cavallino-2027", title: "Cavallino Classic", location: "Palm Beach, USA", startDate: "2027-01-22", endDate: "2027-01-26", industry: "cars", description: "Deep-dive into Ferrari heritage. Auctions, marque displays and panel discussions in Florida sunshine.", contentPrepWeeks: 3, url: "https://www.cavallino.com" },
  { id: "artcurial-2027", title: "Artcurial Retromobile Auction", location: "Paris, France", startDate: "2027-02-05", endDate: "2027-02-06", industry: "cars", description: "Artcurial flagship Paris sale at Retromobile. French marques and European classics at auction.", contentPrepWeeks: 3, url: "https://www.artcurial.com" },
  { id: "ice-st-moritz-2027", title: "The ICE St Moritz", location: "St. Moritz, Switzerland", startDate: "2027-02-14", endDate: "2027-02-14", industry: "cars", description: "Classic cars glide across the frozen lake of St Moritz. High style, collector networking in a unique winter setting.", contentPrepWeeks: 3, url: "https://www.theice.ch" },

  // ── YACHTS · 20 additional events ──────────────────────────────────────
  { id: "caribbean-superyacht-2026", title: "Caribbean Superyacht Rendezvous", location: "St Maarten, Caribbean", startDate: "2026-02-25", endDate: "2026-02-28", industry: "yachts", description: "The Caribbean's most important brokerage rendezvous. 40+ superyachts, senior brokers and UHNW buyers in one anchorage.", contentPrepWeeks: 3 },
  { id: "thailand-boat-2026", title: "Thailand International Boat Show", location: "Pattaya, Thailand", startDate: "2026-02-06", endDate: "2026-02-09", industry: "yachts", description: "Asia's fastest-growing boat show. Southeast Asian charter market entry point and regional fleet networking.", contentPrepWeeks: 3, url: "https://www.thailandboatshow.com" },
  { id: "hiswa-2026", title: "HISWA Amsterdam", location: "Amsterdam, Netherlands", startDate: "2026-03-10", endDate: "2026-03-15", industry: "yachts", description: "Holland's premier in-water boat show. Dutch shipyard and brokerage relationships — gateway to Northern European fleet.", contentPrepWeeks: 3, url: "https://www.hiswate-water.nl" },
  { id: "singapore-yacht-2026", title: "Singapore Yacht Show", location: "ONE°15 Marina, Singapore", startDate: "2026-04-09", endDate: "2026-04-12", industry: "yachts", description: "Asia Pacific's premier superyacht event. UHNW regional buyers, major brokers and charter operators all present.", contentPrepWeeks: 4, url: "https://www.singaporeyachtshow.com" },
  { id: "antigua-sailing-2026", title: "Antigua Sailing Week", location: "Falmouth Harbour, Antigua", startDate: "2026-04-25", endDate: "2026-05-01", industry: "yachts", description: "One of the world's great sailing regattas. 100+ yachts, UHNW sailing enthusiasts and charter fleet networking.", contentPrepWeeks: 3, url: "https://www.sailingweek.com" },
  { id: "navigare-2026", title: "Navigare Valencia", location: "Valencia, Spain", startDate: "2026-04-23", endDate: "2026-04-26", industry: "yachts", description: "Mediterranean pre-season show. Spanish charter market, Balearic Island fleet and brokerage operators.", contentPrepWeeks: 2 },
  { id: "china-rendezvous-2026", title: "China Rendez-Vous", location: "Hainan, China", startDate: "2026-04-28", endDate: "2026-05-01", industry: "yachts", description: "China's leading superyacht event. Access to the world's fastest-growing UHNW buyer base in Asia Pacific.", contentPrepWeeks: 4, url: "https://www.chinaboatshow.com" },
  { id: "loro-piana-regatta-2026", title: "Loro Piana Superyacht Regatta", location: "Porto Cervo, Sardinia", startDate: "2026-06-09", endDate: "2026-06-13", industry: "yachts", description: "The most prestigious sailing regatta for superyachts. YCCS hosted, 30m+ sailing yachts, elite owner networking.", contentPrepWeeks: 3, url: "https://www.yccs.com" },
  { id: "superyacht-cup-palma-2026", title: "Superyacht Cup Palma", location: "Palma, Mallorca", startDate: "2026-06-17", endDate: "2026-06-20", industry: "yachts", description: "Europe's largest superyacht regatta. 30+ racing superyachts, owners, captains and brokers compete and network.", contentPrepWeeks: 3, url: "https://www.superyachtcup.com" },
  { id: "newport-bermuda-2026", title: "Newport Bermuda Race", location: "Newport, Rhode Island / Bermuda", startDate: "2026-06-19", endDate: "2026-06-26", industry: "yachts", description: "One of offshore sailing's blue-ribbon events. UHNW sailing community, yacht owners and transatlantic fleet networking.", contentPrepWeeks: 3, url: "https://www.bermudarace.com" },
  { id: "cowes-week-2026", title: "Cowes Week", location: "Isle of Wight, UK", startDate: "2026-08-01", endDate: "2026-08-08", industry: "yachts", description: "The world's oldest and largest sailing regatta. 700+ yachts, 8,000+ competitors. Royal patronage, elite social calendar.", contentPrepWeeks: 3, url: "https://www.cowesweek.co.uk" },
  { id: "southampton-boat-2026", title: "Southampton International Boat Show", location: "Southampton, UK", startDate: "2026-09-18", endDate: "2026-09-27", industry: "yachts", description: "The UK's largest on-water boat show. 600+ boats, 300+ exhibitors. Key for British charter and brokerage market.", contentPrepWeeks: 3, url: "https://www.southamptonboatshow.com" },
  { id: "genoa-boat-2026", title: "Genoa International Boat Show", location: "Genoa, Italy", startDate: "2026-09-18", endDate: "2026-09-23", industry: "yachts", description: "Italy's flagship nautical event. 1,000+ exhibitors, 900+ boats. Essential for Italian shipyard and charter relationships.", contentPrepWeeks: 3, url: "https://www.salonenautico.com" },
  { id: "barcelonaboat-2026", title: "Barcelona International Boat Show", location: "Barcelona, Spain", startDate: "2026-10-14", endDate: "2026-10-18", industry: "yachts", description: "Spain's premier nautical event. Mediterranean brokerage, charter and superyacht refit market gateway.", contentPrepWeeks: 3, url: "https://www.salon-nautico.com" },
  { id: "superyacht-forum-2026", title: "Superyacht Forum", location: "Amsterdam, Netherlands", startDate: "2026-11-16", endDate: "2026-11-18", industry: "yachts", description: "The superyacht industry's leading leadership forum. 1,000+ senior professionals, new build and refit market intelligence.", contentPrepWeeks: 3, url: "https://www.thesuperyachtforum.com" },
  { id: "boat-builder-awards-2026", title: "Boat Builder Awards", location: "Amsterdam, Netherlands", startDate: "2026-11-17", endDate: "2026-11-17", industry: "yachts", description: "Recognising excellence in superyacht construction and innovation. Shipyard CEOs and naval architects on one stage.", contentPrepWeeks: 2, url: "https://www.theboatbuilderawards.com" },
  { id: "australian-superyacht-2026", title: "Australian Superyacht Rendezvous", location: "Whitsundays, Australia", startDate: "2026-10-22", endDate: "2026-10-25", industry: "yachts", description: "The Southern Hemisphere's leading superyacht event. Pacific charter market and UHNW Australian buyer network.", contentPrepWeeks: 3 },
  { id: "world-yacht-racing-2026", title: "World Yacht Racing Forum", location: "London, UK", startDate: "2026-12-07", endDate: "2026-12-08", industry: "yachts", description: "The racing yacht industry's annual summit. Team principals, sailmakers and UHNW racing yacht owners.", contentPrepWeeks: 2, url: "https://www.worldyachtracer.com" },
  { id: "palma-superyacht-village-2026", title: "Palma Superyacht Village", location: "Palma, Mallorca", startDate: "2026-04-28", endDate: "2026-05-01", industry: "yachts", description: "Pre-season showcase at the heart of the Med's refit capital. New builds, refits and brokerage mandates.", contentPrepWeeks: 2 },
  { id: "tys-phuket-2026", title: "Phuket Rendezvous", location: "Phuket, Thailand", startDate: "2026-12-04", endDate: "2026-12-07", industry: "yachts", description: "High-season Asian charter rendezvous. 30+ superyachts, charter brokers and UHNW clients from across Asia.", contentPrepWeeks: 3 },

  // ── VILLAS · 20 additional events ──────────────────────────────────────
  { id: "luxury-property-london-2026", title: "Luxury Property Show London", location: "Olympia, London, UK", startDate: "2026-02-13", endDate: "2026-02-14", industry: "villas", description: "UK's leading showcase for prime international residential property. Developers, agents and UHNW investors.", contentPrepWeeks: 3, url: "https://www.luxurypropertyshow.co.uk" },
  { id: "ips-dubai-2026", title: "International Property Show Dubai", location: "Dubai, UAE", startDate: "2026-03-22", endDate: "2026-03-24", industry: "villas", description: "MENA's largest property show. Trophy listings from 60+ countries, UHNW Gulf buyers and global developer mandates.", contentPrepWeeks: 3, url: "https://www.internationalpropertyshow.com" },
  { id: "cap-ferrat-summit-2026", title: "Cap Ferrat Property Summit", location: "Cap Ferrat, France", startDate: "2026-04-22", endDate: "2026-04-23", industry: "villas", description: "Invitation-only ultra-prime property forum on the French Riviera. Principals only — no intermediaries.", contentPrepWeeks: 3 },
  { id: "swiss-property-forum-2026", title: "Swiss Property Forum Zurich", location: "Zurich, Switzerland", startDate: "2026-05-20", endDate: "2026-05-21", industry: "villas", description: "Alpine and European ultra-prime market intelligence. Swiss family office mandates and Geneva/Zurich prime listings.", contentPrepWeeks: 3 },
  { id: "private-wealth-monaco-2026", title: "Private Wealth Monaco Forum", location: "Monaco", startDate: "2026-06-11", endDate: "2026-06-12", industry: "villas", description: "Family office and wealth manager forum. Monaco and Riviera property pipeline and UHNW principal introductions.", contentPrepWeeks: 3 },
  { id: "hamptons-summit-2026", title: "Hamptons Luxury Real Estate Summit", location: "Southampton, New York, USA", startDate: "2026-07-09", endDate: "2026-07-10", industry: "villas", description: "East Coast UHNW buyers and top brokers. Trophy estate market intelligence in America's most exclusive summer enclave.", contentPrepWeeks: 3 },
  { id: "aspen-real-estate-2026", title: "Aspen Real Estate Symposium", location: "Aspen, Colorado, USA", startDate: "2026-07-21", endDate: "2026-07-22", industry: "villas", description: "Mountain luxury market summit. Ski-in/ski-out estates, UHNW buyers from tech and finance sectors.", contentPrepWeeks: 3 },
  { id: "knight-frank-private-view-2026", title: "Knight Frank Private View", location: "London, UK", startDate: "2026-09-10", endDate: "2026-09-11", industry: "villas", description: "Invitation-only prime property showcase for UHNW buyers. Off-market listings and senior broker introductions.", contentPrepWeeks: 2, url: "https://www.knightfrank.com" },
  { id: "prime-re-forum-paris-2026", title: "Prime Real Estate Forum Paris", location: "Paris, France", startDate: "2026-09-17", endDate: "2026-09-18", industry: "villas", description: "Paris prime arrondissements and Côte d'Azur market. French developer principals and European UHNW buyer network.", contentPrepWeeks: 3 },
  { id: "hk-luxury-property-2026", title: "Hong Kong Luxury Property Summit", location: "Hong Kong", startDate: "2026-09-22", endDate: "2026-09-23", industry: "villas", description: "Asian UHNW buyer mandates for Mayfair, Monaco and Côte d'Azur. Cross-referral network for global luxury brokers.", contentPrepWeeks: 4 },
  { id: "opp-congress-2026", title: "OPP International Property Congress", location: "London, UK", startDate: "2026-10-07", endDate: "2026-10-08", industry: "villas", description: "Global property investment forum. Overseas prime market intelligence and cross-border UHNW mandates.", contentPrepWeeks: 3, url: "https://www.opp.today" },
  { id: "luxury-re-forum-ny-2026", title: "Luxury Real Estate Forum New York", location: "New York, USA", startDate: "2026-10-13", endDate: "2026-10-14", industry: "villas", description: "Manhattan and Hamptons ultra-prime market. Top 1% brokers, UHNW buyers and global developer presentations.", contentPrepWeeks: 3 },
  { id: "bahrain-property-2026", title: "Bahrain Property Show", location: "Manama, Bahrain", startDate: "2026-10-28", endDate: "2026-10-30", industry: "villas", description: "Gulf trophy real estate. Saudi UHNW buyers and Bahrain waterfront development pipeline.", contentPrepWeeks: 3 },
  { id: "nrep-2026", title: "NREP Nordic Real Estate Forum", location: "Copenhagen, Denmark", startDate: "2026-11-03", endDate: "2026-11-04", industry: "villas", description: "Scandinavia's leading property investment forum. Nordic UHNW buyers and prime Baltic coast development pipeline.", contentPrepWeeks: 3, url: "https://www.nrep.com" },
  { id: "sothebys-nyc-sale-2026", title: "Sotheby's Architecture & Design Sale", location: "New York, USA", startDate: "2026-11-10", endDate: "2026-11-10", industry: "villas", description: "Trophies at the intersection of art and architecture. UHNW collector introductions and branded residence leads.", contentPrepWeeks: 2, url: "https://www.sothebys.com" },
  { id: "singex-property-2026", title: "Singapore International Property Expo", location: "Singapore", startDate: "2026-11-27", endDate: "2026-11-30", industry: "villas", description: "Southeast Asia's largest property show. Asian UHNW buyers for London, Dubai and European trophy listings.", contentPrepWeeks: 3, url: "https://www.singaporepropertyexpo.com" },
  { id: "re-luxury-miami-2027", title: "Luxury Real Estate Forum Miami", location: "Miami Beach, USA", startDate: "2027-02-03", endDate: "2027-02-04", industry: "villas", description: "Miami Beach and Palm Beach trophy estate market. LATAM UHNW buyers and branded waterfront development pipeline.", contentPrepWeeks: 3 },
  { id: "riviera-property-2026", title: "French Riviera Property Forum", location: "Nice, France", startDate: "2026-04-08", endDate: "2026-04-09", industry: "villas", description: "Côte d'Azur developer principals and broker network. Cap Antibes, Saint-Jean and Monaco prime market intelligence.", contentPrepWeeks: 3 },
  { id: "india-luxury-property-2027", title: "India Luxury Property Summit", location: "Mumbai, India", startDate: "2027-01-20", endDate: "2027-01-21", industry: "villas", description: "India's top UHNW developer and buyer summit. Mumbai waterfront, Delhi trophy estates and international cross-referrals.", contentPrepWeeks: 3 },
  { id: "cape-town-property-2026", title: "Cape Town Luxury Property Expo", location: "Cape Town, South Africa", startDate: "2026-03-19", endDate: "2026-03-21", industry: "villas", description: "Southern Africa's premier trophy real estate event. Atlantic Seaboard estates and UHNW African buyer mandates.", contentPrepWeeks: 3 },

  // ── JETS · 21 additional events ──────────────────────────────────────
  { id: "singapore-airshow-2026", title: "Singapore Airshow", location: "Changi, Singapore", startDate: "2026-02-17", endDate: "2026-02-22", industry: "jets", description: "Asia Pacific's largest aerospace event. OEM deals, pre-owned market and UHNW Asian buyer network in one week.", contentPrepWeeks: 5, url: "https://www.singaporeairshow.com" },
  { id: "mro-americas-2026", title: "MRO Americas", location: "Chicago, USA", startDate: "2026-04-14", endDate: "2026-04-16", industry: "jets", description: "World's leading MRO event. Maintenance, parts and avionics suppliers key for fleet management professionals.", contentPrepWeeks: 3, url: "https://www.mro-americas.com" },
  { id: "skytech-2026", title: "SkyTech Arabia", location: "Riyadh, Saudi Arabia", startDate: "2026-04-20", endDate: "2026-04-22", industry: "jets", description: "Saudi Arabia's premier private aviation show. Gulf UHNW fleet owners and VIP operator introductions.", contentPrepWeeks: 4 },
  { id: "baltic-av-forum-2026", title: "Baltic Aviation Forum", location: "Vilnius, Lithuania", startDate: "2026-05-13", endDate: "2026-05-14", industry: "jets", description: "Northern European business aviation leadership summit. Pre-owned inventory and operator market intelligence.", contentPrepWeeks: 2, url: "https://www.balticaviationforum.com" },
  { id: "african-bav-2026", title: "AAA African Aviation Summit", location: "Cape Town, South Africa", startDate: "2026-05-27", endDate: "2026-05-28", industry: "jets", description: "African continent's leading business aviation gathering. Emerging UHNW buyer mandates across Sub-Saharan Africa.", contentPrepWeeks: 3, url: "https://www.africanaviationawards.com" },
  { id: "paris-airshow-2027", title: "Paris Air Show", location: "Le Bourget, Paris", startDate: "2027-06-16", endDate: "2027-06-22", industry: "jets", description: "The world's most prestigious airshow. OEM order announcements, new aircraft debuts and industry deal flow.", contentPrepWeeks: 6, url: "https://www.siae.fr" },
  { id: "airventure-2026", title: "EAA AirVenture Oshkosh", location: "Oshkosh, Wisconsin, USA", startDate: "2026-07-27", endDate: "2026-08-02", industry: "jets", description: "World's largest aviation event. 600,000 attendees, 10,000+ aircraft. Deep community, private owner relationships.", contentPrepWeeks: 3, url: "https://www.eaa.org/airventure" },
  { id: "labace-2026", title: "LABACE São Paulo", location: "São Paulo, Brazil", startDate: "2026-08-11", endDate: "2026-08-13", industry: "jets", description: "Latin America's leading business aviation event. UHNW Brazilian buyers, fleet operators and pre-owned market.", contentPrepWeeks: 4, url: "https://www.labace.com.br" },
  { id: "hkbac-2026", title: "Hong Kong Business Aviation Centre Forum", location: "Hong Kong", startDate: "2026-09-15", endDate: "2026-09-16", industry: "jets", description: "Asia's most significant private aviation forum. Greater China UHNW buyer mandates and fleet management strategies.", contentPrepWeeks: 3 },
  { id: "corpjet-investor-london-2026", title: "Corporate Jet Investor London", location: "London, UK", startDate: "2026-10-13", endDate: "2026-10-14", industry: "jets", description: "Aircraft financing and transaction intelligence. Lenders, lessors and UHNW fleet acquisition strategies.", contentPrepWeeks: 3, url: "https://www.corporatejetinvestor.com" },
  { id: "aopa-summit-2026", title: "AOPA Summit", location: "Oklahoma City, USA", startDate: "2026-10-08", endDate: "2026-10-11", industry: "jets", description: "AOPA's flagship aviation gathering. 15,000+ pilots and owners. Private aircraft market and operator networking.", contentPrepWeeks: 3, url: "https://www.aopa.org" },
  { id: "world-av-festival-2026", title: "World Aviation Festival", location: "London, UK", startDate: "2026-10-13", endDate: "2026-10-14", industry: "jets", description: "Aviation technology and strategy summit. Airline and private aviation leaders; digital disruption and sustainability.", contentPrepWeeks: 3, url: "https://www.world.aviation-festival.com" },
  { id: "abu-dhabi-air-2026", title: "Abu Dhabi Air Expo", location: "Al Bateen, Abu Dhabi", startDate: "2026-11-04", endDate: "2026-11-06", industry: "jets", description: "Gulf region's dedicated business aviation show. UAE and GCC UHNW fleet acquisitions and charter operator deals.", contentPrepWeeks: 3, url: "https://www.adairexpo.com" },
  { id: "bombardier-summit-2026", title: "Bombardier Customer Summit", location: "Montreal, Canada", startDate: "2026-03-03", endDate: "2026-03-04", industry: "jets", description: "Global 7500 and Challenger fleet owner and buyer gathering. Factory tours, order incentives and operator community.", contentPrepWeeks: 3, url: "https://www.bombardier.com" },
  { id: "gulfstream-forum-2026", title: "Gulfstream Customer Forum", location: "Savannah, Georgia, USA", startDate: "2026-10-05", endDate: "2026-10-06", industry: "jets", description: "G700 and G800 owner community. Factory access, fleet updates and principal network for Gulfstream operators.", contentPrepWeeks: 3, url: "https://www.gulfstream.com" },
  { id: "jet-av-forum-zurich-2026", title: "Jet Aviation Switzerland Forum", location: "Zurich, Switzerland", startDate: "2026-05-06", endDate: "2026-05-07", industry: "jets", description: "European fleet management and completions intelligence. Swiss UHNW fleet owners and management company mandates.", contentPrepWeeks: 2 },
  { id: "vistajet-symposium-2026", title: "VistaJet Global Member Symposium", location: "London, UK", startDate: "2026-09-24", endDate: "2026-09-25", industry: "jets", description: "VistaJet's flagship principal gathering. UHNW member network, fleet programme and Bombardier partnership deals.", contentPrepWeeks: 2, url: "https://www.vistajet.com" },
  { id: "caac-forum-2026", title: "CAAC Private Aviation Forum", location: "Beijing, China", startDate: "2026-11-24", endDate: "2026-11-25", industry: "jets", description: "China's civil aviation authority forum on business aviation. Regulatory outlook and Chinese UHNW market access.", contentPrepWeeks: 3 },
  { id: "jetcraft-summit-2026", title: "JetCraft World Summit", location: "Geneva, Switzerland", startDate: "2026-02-24", endDate: "2026-02-25", industry: "jets", description: "Preowned aircraft transaction intelligence and market outlook from one of the world's leading brokerages.", contentPrepWeeks: 2, url: "https://www.jetcraft.com" },
  { id: "embraer-forum-2026", title: "Embraer Business Aviation Forum", location: "São Paulo, Brazil", startDate: "2026-08-04", endDate: "2026-08-05", industry: "jets", description: "Praetor and Phenom fleet community. Factory visits, owner networking and LATAM market outlook.", contentPrepWeeks: 2, url: "https://www.embraer.com" },
  { id: "charter-av-summit-2027", title: "International Charter Aviation Summit", location: "Dubai, UAE", startDate: "2027-01-27", endDate: "2027-01-28", industry: "jets", description: "Charter operator and broker leadership forum. On-demand market growth, UHNW acquisition strategies and fleet deals.", contentPrepWeeks: 3 },

  // ── CARS · 20 additional events ──────────────────────────────────────
  { id: "barrett-jackson-scottsdale-2027", title: "Barrett-Jackson Scottsdale", location: "Scottsdale, Arizona, USA", startDate: "2027-01-18", endDate: "2027-01-26", industry: "cars", description: "America's most-watched collector car auction. $150M+ across 1,500 lots. Opens the global collector car season.", contentPrepWeeks: 4, url: "https://www.barrett-jackson.com" },
  { id: "techno-classica-2026", title: "Techno-Classica Essen", location: "Essen, Germany", startDate: "2026-03-25", endDate: "2026-03-30", industry: "cars", description: "World's largest classic car trade fair. 2,700 dealers, 175,000 visitors. Rare German marques and UHNW collector deals.", contentPrepWeeks: 4, url: "https://www.siha.de/techno-classica" },
  { id: "geneva-motor-2026", title: "Geneva International Motor Show", location: "Geneva, Switzerland", startDate: "2026-02-24", endDate: "2026-03-08", industry: "cars", description: "One of the world's most prestigious motor shows. Hypercar world premieres and luxury brand debuts in financial Geneva.", contentPrepWeeks: 5, url: "https://www.gims.swiss" },
  { id: "mille-miglia-2026", title: "Mille Miglia", location: "Brescia to Rome, Italy", startDate: "2026-05-14", endDate: "2026-05-17", industry: "cars", description: "The world's most beautiful road race. 450 historic cars, 1,000 miles through Italy. Elite collector and OEM hospitality.", contentPrepWeeks: 4, url: "https://www.1000miglia.it" },
  { id: "nurburgring-24h-2026", title: "Nürburgring 24 Hours", location: "Nürburgring, Germany", startDate: "2026-05-28", endDate: "2026-05-31", industry: "cars", description: "The world's most gruelling endurance race. Factory teams, am drivers and collector hospitality at the Green Hell.", contentPrepWeeks: 3, url: "https://www.nuerburgring.de" },
  { id: "chantilly-arts-2026", title: "Chantilly Arts & Elegance", location: "Chantilly, France", startDate: "2026-09-06", endDate: "2026-09-07", industry: "cars", description: "France's most prestigious concours at Château de Chantilly. Invitation-only, rare coachbuilt cars and supercar debuts.", contentPrepWeeks: 3, url: "https://www.chantilly-arts-elegance.com" },
  { id: "tour-elegance-2026", title: "Pebble Beach Tour d'Elegance", location: "Pebble Beach, USA", startDate: "2026-08-13", endDate: "2026-08-13", industry: "cars", description: "Official pre-event of Pebble Beach Concours. 200+ concours cars tour the Big Sur coastline. Collector networking.", contentPrepWeeks: 2, url: "https://www.pebblebeachconcours.net" },
  { id: "broad-arrow-monterey-2026", title: "Broad Arrow Monterey Auction", location: "Pebble Beach, USA", startDate: "2026-08-14", endDate: "2026-08-15", industry: "cars", description: "Rising force in blue-chip collector car auctions. Trophy lots and emerging collector investment during Monterey Car Week.", contentPrepWeeks: 3, url: "https://www.broadarrowauctions.com" },
  { id: "gooding-pebble-2026", title: "Gooding & Company Pebble Beach", location: "Pebble Beach, USA", startDate: "2026-08-15", endDate: "2026-08-16", industry: "cars", description: "Premier Pebble Beach auction house. World record lots, $100M+ sales and the finest pre-war European classics.", contentPrepWeeks: 4, url: "https://www.goodingco.com" },
  { id: "concours-avenue-2026", title: "Concours on the Avenue", location: "Carmel-by-the-Sea, USA", startDate: "2026-08-11", endDate: "2026-08-11", industry: "cars", description: "Free public concours on Ocean Avenue. Gateway event for first-time Monterey Car Week visitors and collectors.", contentPrepWeeks: 2, url: "https://www.concoursonthavenur.com" },
  { id: "salon-prive-scotland-2026", title: "Salon Privé Scotland", location: "Blenheim-linked Scottish event, UK", startDate: "2026-06-26", endDate: "2026-06-28", industry: "cars", description: "Scottish edition of Britain's most exclusive concours. New hypercar debuts and invitation-only UHNW networking.", contentPrepWeeks: 3, url: "https://www.salonprivelondon.com" },
  { id: "hilton-head-2026", title: "Hilton Head Island Concours", location: "Hilton Head, South Carolina, USA", startDate: "2026-10-23", endDate: "2026-10-25", industry: "cars", description: "East Coast's most prestigious concours. AACA judged. UHNW Carolinas and Florida collector network.", contentPrepWeeks: 3, url: "https://www.hhiconcours.com" },
  { id: "la-auto-show-2026", title: "Los Angeles Auto Show", location: "Los Angeles, USA", startDate: "2026-11-20", endDate: "2026-11-30", industry: "cars", description: "World premieres from hypercar OEMs targeting Hollywood and Silicon Valley's UHNW buyer base.", contentPrepWeeks: 4, url: "https://www.laautoshow.com" },
  { id: "essen-motor-show-2026", title: "Essen Motor Show", location: "Essen, Germany", startDate: "2026-11-28", endDate: "2026-12-06", industry: "cars", description: "Germany's iconic classic and performance car show. 500+ exhibitors, rare German collector machinery and UHNW networking.", contentPrepWeeks: 3, url: "https://www.essen-motorshow.de" },
  { id: "tokyo-mobility-2025", title: "Japan Mobility Show Tokyo", location: "Tokyo, Japan", startDate: "2026-10-23", endDate: "2026-11-04", industry: "cars", description: "Japan's premier motor show. Asian hypercar launches, domestic collector market and cross-referral UHNW introductions.", contentPrepWeeks: 4, url: "https://www.japan-mobility-show.com" },
  { id: "historic-motorsport-intl-2027", title: "Historic Motorsport International", location: "ExCeL London, UK", startDate: "2027-01-08", endDate: "2027-01-09", industry: "cars", description: "UK's largest specialist classic and competition car show. Racing heritage, rare historic lots and collector previews.", contentPrepWeeks: 3, url: "https://www.historicmotorsportshow.com" },
  { id: "gooding-amelia-2026", title: "Gooding & Company Amelia Island", location: "Amelia Island, USA", startDate: "2026-03-07", endDate: "2026-03-07", industry: "cars", description: "Gooding's East Coast flagship. European classics and American blue-chips co-located with Amelia Island Concours.", contentPrepWeeks: 3, url: "https://www.goodingco.com" },
  { id: "rm-paris-2026", title: "RM Sotheby's Paris Sale", location: "Paris, France", startDate: "2026-02-06", endDate: "2026-02-06", industry: "cars", description: "RM's prestigious annual Paris auction at the Place Vauban. Rare pre-war French coachwork and modern hypercars.", contentPrepWeeks: 3, url: "https://rmsothebys.com" },
  { id: "modena-motor-2026", title: "Modena Motor Gallery", location: "Modena, Italy", startDate: "2026-10-29", endDate: "2026-11-01", industry: "cars", description: "Celebrating Modena's automotive heritage — Ferrari, Maserati, De Tomaso. Factory access and collector networking.", contentPrepWeeks: 3 },
  { id: "blenheim-palace-2026", title: "Salon Privé Blenheim Palace", location: "Blenheim Palace, Oxfordshire, UK", startDate: "2026-09-02", endDate: "2026-09-05", industry: "cars", description: "Britain's most prestigious concours. Invitation-only gathering of the world's finest motor cars at a UNESCO World Heritage site.", contentPrepWeeks: 4, url: "https://www.salonprivelondon.com" },
];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Local calendar date, not UTC — d.toISOString() rolls over at UTC midnight, which
// desyncs "today" from the user's actual local day (daily ritual caching, streaks,
// and the "today" badge all key off this).
function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function weekStartIso(d = new Date()) {
  const dt = new Date(d);
  const day = dt.getUTCDay();
  const diff = (day + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - diff);
  return dt.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";
  const { industry, industryId, setIndustry } = useIndustry();
  const { session, user } = useAuth();
  const isDemo = !session;
  const now = useNow();
  const [profileName, setProfileName] = useState<string | null>(null);
  const { state: core, update: updateCore } = useAurumCoreState();
  const { isPro, startCheckout } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { profile: userProfile } = useUserProfile();

  // Academy progress: track -> { total, completed }
  const [academyProgress, setAcademyProgress] = useState<Record<string, { total: number; completed: number }>>({});

  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<string[]>(industry.dailyObjectives);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [completionMsg, setCompletionMsg] = useState<string | null>(null);

  const [calFilter, setCalFilter] = React.useState<string>("all");
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const calToday = new Date();
  const [viewMonth, setViewMonth] = React.useState(calToday.getMonth());
  const [viewYear, setViewYear] = React.useState(calToday.getFullYear());

  const recFn = useServerFn(generateRecommendation);
  const tasksFn = useServerFn(generateDailyTasks);

  const todayStr = isoDay();

  const completed = dailyTasks.filter((_, i) => done[i]).length;
  const total = dailyTasks.length || 1;
  const allDone = total > 0 && completed === total;

  // CAP-59: show completion message once per day when all rituals are done
  useEffect(() => {
    if (!allDone) return;
    const key = `aurum:ritualMsg:${user?.id ?? "demo"}:${todayStr}`;
    const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (stored) { setCompletionMsg(stored); return; }
    const msg = t.dashCompletionMessages[Math.floor(Math.random() * t.dashCompletionMessages.length)];
    if (typeof window !== "undefined") localStorage.setItem(key, msg);
    setCompletionMsg(msg);
  }, [allDone, todayStr, user?.id, t]);

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
    return () => { alive = false; };
  }, [user]);

  // Load real academy module counts + user progress from DB
  useEffect(() => {
    let alive = true;
    (async () => {
      // Total modules per track
      const { data: modData } = await (supabase.from("academy_modules") as any)
        .select("track");
      const totals: Record<string, number> = {};
      for (const row of (modData ?? []) as { track: string }[]) {
        totals[row.track] = (totals[row.track] ?? 0) + 1;
      }

      // Completed modules for this user
      const completed: Record<string, number> = {};
      if (user) {
        const { data: progData } = await (supabase.from("user_module_progress") as any)
          .select("module_id")
          .eq("user_id", user.id)
          .eq("quiz_passed", true);
        const completedIds = new Set((progData ?? []).map((r: { module_id: string }) => r.module_id));

        if (completedIds.size > 0) {
          const { data: modRows } = await (supabase.from("academy_modules") as any)
            .select("id, track")
            .in("id", Array.from(completedIds));
          for (const row of (modRows ?? []) as { id: string; track: string }[]) {
            completed[row.track] = (completed[row.track] ?? 0) + 1;
          }
        }
      }

      if (!alive) return;
      const result: Record<string, { total: number; completed: number }> = {};
      for (const track of Object.keys(totals)) {
        result[track] = { total: totals[track], completed: completed[track] ?? 0 };
      }
      setAcademyProgress(result);
    })();
    return () => { alive = false; };
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
      // CAP-78: personalize daily rituals using the onboarding ritual profile (if set)
      ritualProfile: c.ritual_profile ?? undefined,
      // Tell generation not to repeat what this mode has already been given recently.
      avoidTasks: (c.daily_tasks_history?.[industryId] ?? []).slice(-20),
    };

    const recStale =
      !summary?.recommendation ||
      !c.ai_summary_updated_at ||
      Date.now() - new Date(c.ai_summary_updated_at).getTime() > 6 * 3_600_000 ||
      summary?.mode !== industry.label;
    if (recStale) {
      refreshRecommendation(ctx);
    } else {
      setRecommendation(summary?.recommendation ?? null);
    }

    // CAP-93: rituals are cached per (day, mode) — locked for the calendar day within
    // a mode (CAP-60), but switching modes shows that mode's own tasks instead of
    // whichever mode happened to generate first today.
    const isCachedToday = c.daily_tasks_date === isoDay();
    const cachedForMode = isCachedToday ? (c.daily_tasks as Record<string, { mode?: string; tasks?: string[] }> | null)?.[industryId] : null;
    const tasksAreForToday = (cachedForMode?.tasks?.length ?? 0) > 0;
    // CAP-60: once completed, no new tasks generate for that day (per mode)
    const doneKey = `aurum:ritualsDone:${user?.id ?? ""}:${isoDay()}:${industryId}`;
    const alreadyCompletedToday = typeof window !== "undefined" && !!localStorage.getItem(doneKey);
    if (tasksAreForToday) {
      setDailyTasks(cachedForMode!.tasks!);
      setDone({});
    } else if (!alreadyCompletedToday) {
      refreshDailyTasks(ctx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, industryId, core?.id, industry.label]);

  // CAP-60 fix: restore today's completed-ritual checkmarks on reload by
  // matching today's daily_ritual entries in aurum_tasks against dailyTasks.
  useEffect(() => {
    if (!user || dailyTasks.length === 0) return;
    let alive = true;
    (async () => {
      // Local midnight, not UTC midnight — `isoDay() + "T00:00:00Z"` treated the local
      // calendar date as if it were already a UTC instant, which for anyone offset from
      // UTC restored checkmarks for the wrong window (bleeding into yesterday evening's
      // completions, or missing part of today's).
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("aurum_tasks")
        .select("title")
        .eq("user_id", user.id)
        .eq("source", "daily_ritual")
        .gte("completed_at", startOfToday.toISOString());
      if (!alive || error || !data) return;
      const completedTitles = new Set((data as { title: string }[]).map((r) => r.title));
      if (completedTitles.size === 0) return;
      setDone((d) => {
        const next = { ...d };
        dailyTasks.forEach((t, i) => {
          if (completedTitles.has(t)) next[i] = true;
        });
        return next;
      });
    })();
    return () => { alive = false; };
  }, [user, dailyTasks]);

  async function toggle(i: number) {
    const wasDone = !!done[i];
    setDone((d) => ({ ...d, [i]: !d[i] }));
    if (!user) return;

    // Local midnight, not UTC midnight — same fix as isoDay() itself (see calendar.tsx).
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = isoDay();
    const doneKey = `aurum:ritualsDone:${user.id}:${today}:${industryId}`;
    const STREAK_KEY = `aurum:lastStreakDate:${user.id}`;

    if (!wasDone) {
      // CAP-60: mark today as completed if this was the last task
      const nowAllDone = dailyTasks.every((_, idx) => idx === i ? true : !!done[idx]);
      if (nowAllDone && typeof window !== "undefined") {
        localStorage.setItem(doneKey, "1");
      }

      const last = typeof window !== "undefined" ? localStorage.getItem(STREAK_KEY) : null;
      let nextStreak = core?.streak ?? 0;
      if (last !== today) {
        const yesterday = isoDay(new Date(Date.now() - 86_400_000));
        nextStreak = last === yesterday ? nextStreak + 1 : 1;
        if (typeof window !== "undefined") localStorage.setItem(STREAK_KEY, today);
      }

      // Dedup: skip if this task was already completed today
      const { data: existing } = await supabase
        .from("aurum_tasks")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", dailyTasks[i])
        .eq("source", "daily_ritual")
        .gte("completed_at", startOfToday.toISOString())
        .maybeSingle();
      if (!existing) {
        const { error } = await (supabase as any).from("aurum_tasks").insert({
          user_id: user.id,
          title: dailyTasks[i],
          status: "completed",
          priority: "medium",
          source: "daily_ritual",
          // CAP-93: tag which mode this ritual belongs to, so Calendar can color it per mode.
          industry: industryId,
          completed_at: new Date().toISOString(),
        });
        if (error) console.error("[aurum_tasks] insert failed:", error.message);
      }

      // Derive today's score from actual DB count (self-healing, resets daily automatically)
      const { count } = await supabase
        .from("aurum_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", startOfToday.toISOString());

      await updateCore({
        execution_score: count ?? (core?.execution_score ?? 0) + 1,
        streak: nextStreak,
      });

      if (nextStreak > (core?.streak ?? 0) && STREAK_MILESTONES.includes(nextStreak)) {
        celebrate({
          icon: Flame,
          title: t.celebrationStreakTitle(nextStreak),
          subtitle: t.celebrationStreakSubtitle,
        });
      }
    } else {
      // Undo — the user unchecked a task (possibly an accidental click). Remove today's
      // completion row so this doesn't just flip the local checkbox: the Calendar reads
      // completed rows directly from aurum_tasks, so without this delete an undone task
      // would keep showing as completed there (and reappear checked here on reload).
      if (typeof window !== "undefined") localStorage.removeItem(doneKey);

      await supabase
        .from("aurum_tasks")
        .delete()
        .eq("user_id", user.id)
        .eq("title", dailyTasks[i])
        .eq("source", "daily_ritual")
        .gte("completed_at", startOfToday.toISOString());

      const { count } = await supabase
        .from("aurum_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", startOfToday.toISOString());

      // If that was the only completion today, roll back today's streak bump too —
      // it was awarded for doing something, and now nothing is done today.
      let nextStreak = core?.streak ?? 0;
      if (!count && typeof window !== "undefined" && localStorage.getItem(STREAK_KEY) === today) {
        nextStreak = Math.max(0, nextStreak - 1);
        localStorage.removeItem(STREAK_KEY);
      }

      await updateCore({
        execution_score: count ?? Math.max(0, (core?.execution_score ?? 1) - 1),
        streak: nextStreak,
      });
    }
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
    ritualProfile?: RitualProfile;
    avoidTasks?: string[];
  }) {
    if (!user) return;
    setTasksLoading(true);
    try {
      const { tasks } = await tasksFn({ data: ctx });
      setDailyTasks(tasks);
      setDone({});
      // CAP-93: keep other modes' tasks generated earlier today; only overwrite this mode's
      // slot. If the cached batch is from a previous day, start a fresh per-mode map.
      const isCachedToday = core?.daily_tasks_date === isoDay();
      const existingMap = isCachedToday ? (core?.daily_tasks as Record<string, { mode?: string; tasks?: string[] }> | null) ?? {} : {};
      // Roll this batch into the per-mode "already used" history so tomorrow's
      // generation (or a regenerate today) knows not to repeat it. Capped so the
      // prompt payload and stored JSON don't grow unbounded over months of use.
      const existingHistory = (core?.daily_tasks_history as Record<string, string[]> | null) ?? {};
      const nextHistoryForMode = Array.from(new Set([...(existingHistory[industryId] ?? []), ...tasks])).slice(-60);
      await updateCore({
        daily_tasks: { ...existingMap, [industryId]: { mode: industry.label, tasks } } as any,
        daily_tasks_date: isoDay(),
        daily_tasks_history: { ...existingHistory, [industryId]: nextHistoryForMode } as any,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTasksLoading(false);
    }
  }

  const welcome = useMemo(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
    return t.dashWelcomes[dayOfYear % t.dashWelcomes.length];
  }, [now, t]);

  const dayName = now.toLocaleDateString(dateLocale, { weekday: "long" });
  const dateLong = now.toLocaleDateString(dateLocale, { month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false });

  const hubs = INDUSTRY_LIST.map((m) => ({
    ...m,
    active: m.id === industryId,
    nextEvent: m.upcoming[0],
  }));


  return (
    <AppShell>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {isDemo && (
        <div className="mb-6 flex items-center justify-between gap-4 glass rounded-xl px-4 sm:px-5 py-3 border border-primary/20 animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.32em] text-primary/80 uppercase">{t.dashDemoMode}</div>
              <div className="text-sm text-foreground/90 truncate">
                {t.dashDemoMessage}
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs tracking-wide text-primary-foreground shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            {t.dashSignIn}
          </Link>
        </div>
      )}

      {!isDemo && !isPro && (
        <div className="mb-6 flex items-center justify-between gap-4 glass rounded-xl px-4 sm:px-5 py-3 border border-primary/20 animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.32em] text-primary/80 uppercase">{t.dashFreePlan}</div>
              <div className="text-sm text-foreground/90 truncate">
                {t.dashUpgradeMessage}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs tracking-wide text-primary-foreground shadow-[var(--shadow-gold)]"
            style={{ background: "var(--gradient-gold)" }}
          >
            {t.dashUpgradeCta}
          </button>
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
              {t.greeting(now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening")},
              <br />
              <span className="text-gold-gradient italic">
                {profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operator"}.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">{welcome}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/mentor"
                search={{ prompt: undefined }}
                className="inline-flex items-center gap-2 text-primary-foreground rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-gold)]"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Sparkles className="h-4 w-4 text-primary-foreground" /> {t.dashSpeakWithAurum}
              </Link>
              <Link
                to="/intelligence"
                className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 text-sm border border-border/60 hover:border-primary/50 transition-colors"
              >
                <Radio className="h-4 w-4 text-primary" /> {t.dashOpenIntelligence}
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

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        <AnimateIn delay={0} className="lg:col-span-2">
        <section className="space-y-6 lg:space-y-8">
          <Card>
            {/* CAP-59: custom header with completion badge + banner */}
            <div className="flex items-start justify-between mb-5 gap-4">
              <div>
                <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-2">{t.dashTodayEyebrow(industry.modeLabel)}</div>
                <h2 className="font-serif text-xl sm:text-[22px] leading-tight">{t.dashDailyRitual}</h2>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-muted-foreground font-mono mb-1">{tasksLoading ? "…" : t.dashOfCount(completed, total)}</div>
                {allDone && (
                  <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.25em] text-primary animate-pulse">
                    <Sparkles className="h-2.5 w-2.5" /> {t.dashAllComplete}
                  </span>
                )}
              </div>
            </div>
            {allDone && completionMsg && <CompletionBanner message={completionMsg} />}
            <div className="space-y-1.5">
              {dailyTasks.map((task, i) => {
                const isDone = !!done[i];
                const badge = RITUAL_BADGE[industryId];
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`group w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${isDone ? "bg-secondary/20" : "hover:bg-secondary/40"}`}
                  >
                    <div
                      className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center border transition-colors ${isDone ? "bg-primary border-primary" : "border-border/70 group-hover:border-primary/60"}`}
                    >
                      {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div
                      className={`flex-1 text-[15px] leading-snug ${isDone ? "text-muted-foreground/70 line-through" : "text-foreground"}`}
                    >
                      {task}
                    </div>
                    {badge && (
                      <span className="hidden sm:flex items-center gap-1 shrink-0" title={`${badge.label} Mode`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        <span className={`text-[8px] tracking-[0.15em] uppercase ${badge.text}`}>{badge.label}</span>
                      </span>
                    )}
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/40" />
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
              {t.dashMomentumLabel(Math.round((completed / total) * 100))}
            </div>
          </Card>

          <div>
            <SubHeading eyebrow={t.dashAcademyEyebrow} title={t.dashYourTracks} />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {hubs.map((m) => {
                const Icon = m.icon;
                const trackSlug = INDUSTRY_TO_TRACK[m.id];
                // Map industry ID to DB track name
                const dbTrack = trackSlug === "yachting" ? "yachts" : trackSlug === "property" ? "villas" : trackSlug === "aviation" ? "jets" : "cars";
                const prog = academyProgress[dbTrack];
                const trackTotal = prog?.total ?? 0;
                const trackDone = prog?.completed ?? 0;
                const pct = trackTotal > 0 ? (trackDone / trackTotal) * 100 : 0;
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
                        {m.id === "yachts"
                          ? m.active && <span className="text-[8px] tracking-[0.3em] text-primary/90">LIVE</span>
                          : <Lock className="h-3 w-3 text-muted-foreground/60" />
                        }
                      </div>
                      <div>
                        <div className="font-serif text-lg leading-tight">{m.label}</div>
                        {trackTotal > 0 ? (
                          <>
                            <div className="mt-2 h-0.5 bg-secondary/60 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--gradient-gold)" }} />
                            </div>
                            <div className="mt-1.5 text-[10px] tracking-wider text-muted-foreground uppercase">
                              {m.id === "yachts" ? t.dashTrackComplete(trackDone, trackTotal) : t.dashComingSoon}
                            </div>
                          </>
                        ) : (
                          <div className="mt-1 text-[10px] tracking-wider text-muted-foreground uppercase">{t.dashComingSoon}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        </AnimateIn>

        <AnimateIn delay={120}>
        <aside className="space-y-6 lg:space-y-8">
      <div className="space-y-6 lg:-mt-[5.5rem]">
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setCalFilter("all")} className={"px-4 py-1.5 rounded-full border text-xs tracking-[0.2em] uppercase transition-all " + (calFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
            {t.dashAllIndustries}
          </button>
          <div className="flex gap-2">
            {(["yachts", "villas", "jets", "cars"] as const).map((f) => (
              <button key={f} onClick={() => setCalFilter(f)} className={"px-4 py-1.5 rounded-full border text-xs tracking-[0.2em] uppercase transition-all " + (calFilter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); }} className="p-1 rounded hover:bg-primary/10 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold">{t.monthShort[viewMonth]} {viewYear}</span>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); }} className="p-1 rounded hover:bg-primary/10 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {t.weekdayLetters.map((d, i) => <div key={i} className="text-center text-[10px] text-muted-foreground/50 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {(() => {
                const firstDay = new Date(viewYear, viewMonth, 1);
                const lastDay = new Date(viewYear, viewMonth + 1, 0);
                const startDow = (firstDay.getDay() + 6) % 7;
                const todayDate = isoDay();
                const cells: React.ReactNode[] = [];
                for (let i = 0; i < startDow; i++) {
                  const d = new Date(viewYear, viewMonth, 1 - (startDow - i));
                  cells.push(<div key={"prev-" + i} className="min-h-[52px] p-0.5 opacity-20"><div className="text-[10px] text-right text-muted-foreground">{d.getDate()}</div></div>);
                }
                for (let day = 1; day <= lastDay.getDate(); day++) {
                  const dateStr = viewYear + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
                  const isToday = dateStr === todayDate;
                  const dayEvents = CALENDAR_EVENTS.filter((e) => {
                    if (calFilter !== "all" && e.industry !== calFilter) return false;
                    return e.startDate <= dateStr && e.endDate >= dateStr;
                  });
                  cells.push(
                    <div key={day} className={"min-h-[52px] p-0.5 rounded transition-all " + (isToday ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-secondary/20") + (dayEvents.length > 0 ? " cursor-pointer" : "")} onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}>
                      <div className={"text-[10px] text-right mb-0.5 " + (isToday ? "text-primary font-bold" : "text-muted-foreground/60")}>{day}</div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }} className={"text-[8px] leading-tight px-0.5 py-0.5 rounded truncate cursor-pointer " + (e.industry === "yachts" ? "bg-blue-400/20 text-blue-300" : e.industry === "villas" ? "bg-emerald-400/20 text-emerald-300" : e.industry === "jets" ? "bg-violet-400/20 text-violet-300" : "bg-orange-400/20 text-orange-300") + (selectedEvent?.id === e.id ? " ring-1 ring-white/20" : "")}>
                            {e.title.split(" ").slice(0, 2).join(" ")}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div className="text-[8px] text-muted-foreground/50">+{dayEvents.length - 2}</div>}
                      </div>
                    </div>
                  );
                }
                const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
                for (let i = 1; i <= remaining; i++) {
                  cells.push(<div key={"next-" + i} className="min-h-[52px] p-0.5 opacity-20"><div className="text-[10px] text-right text-muted-foreground">{i}</div></div>);
                }
                return cells;
              })()}
            </div>
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-3 flex-wrap">
              {(["yachts","villas","jets","cars"] as const).map((ind) => (
                <div key={ind} className="flex items-center gap-1">
                  <span className={"h-1.5 w-1.5 rounded-full " + (ind === "yachts" ? "bg-blue-400" : ind === "villas" ? "bg-emerald-400" : ind === "jets" ? "bg-violet-400" : "bg-orange-400")} />
                  <span className="text-[10px] text-muted-foreground capitalize">{ind}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            {selectedEvent ? (
              <div className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={"w-2 h-2 rounded-full " + (selectedEvent.industry === "yachts" ? "bg-blue-400" : selectedEvent.industry === "villas" ? "bg-emerald-400" : selectedEvent.industry === "jets" ? "bg-violet-400" : "bg-orange-400")} />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{selectedEvent.industry.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                {(() => {
                  const daysUntil = Math.ceil((new Date(selectedEvent.startDate).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000);
                  if (daysUntil > 0) return (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 w-fit">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-primary">{t.dashDaysAway(daysUntil)}</span>
                    </div>
                  );
                  if (daysUntil === 0) return (
                    <div className="flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 rounded-lg px-3 py-2 w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-semibold text-emerald-400">{t.dashHappeningToday}</span>
                    </div>
                  );
                  return (
                    <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-lg px-3 py-2 w-fit">
                      <span className="text-sm text-muted-foreground">{t.dashEventPassed}</span>
                    </div>
                  );
                })()}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedEvent.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(selectedEvent.startDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}{selectedEvent.startDate !== selectedEvent.endDate && " - " + new Date(selectedEvent.endDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-primary">
                    <Sparkles className="w-3.5 h-3.5" />{t.dashContentPrepWindow}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.dashStartPosting(selectedEvent.contentPrepWeeks)}</p>
                  <div className="text-xs">
                    {(() => {
                      const prepStart = new Date(selectedEvent.startDate);
                      prepStart.setDate(prepStart.getDate() - selectedEvent.contentPrepWeeks * 7);
                      const diff = Math.ceil((prepStart.getTime() - new Date().setHours(0,0,0,0)) / 86_400_000);
                      if (diff > 0) return t.dashContentWindowOpensIn(diff, prepStart.toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" }));
                      if (Math.ceil((new Date(selectedEvent.startDate).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000) > 0) return t.dashContentWindowOpenNow;
                      return t.dashEventHasPassed;
                    })()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to="/studio" search={{ idea: selectedEvent.title + " — " + selectedEvent.location + ". " + selectedEvent.description, intel: undefined }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                    <Sparkles className="w-3.5 h-3.5" />{t.dashCreateContentForEvent}
                  </Link>
                  {selectedEvent.url && (
                    <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:border-primary/40 transition-colors">
                      {t.dashVisitOfficialSite}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center space-y-3">
                <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <div className="font-medium">{t.dashSelectEvent}</div>
                <p className="text-sm text-muted-foreground">{t.dashSelectEventDesc}</p>
              </div>
            )}
          </div>
        </div>
      </div>
        </aside>
        </AnimateIn>
      </div>

    </AppShell>
  )
}
function CompletionBanner({ message }: { message: string }) {
  // Split leading emoji from body text
  const match = message.match(/^([\p{Emoji}\s]+?)(\s+)(.+)$/su);
  const emoji = match?.[1]?.trim() ?? "✨";
  const text = match?.[3] ?? message;

  return (
    <div className="relative mb-5 rounded-xl overflow-hidden animate-fade-up">
      {/* Dark gold base */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, oklch(0.19 0.04 65), oklch(0.14 0.015 50))" }}
      />
      {/* Gold shimmer layer */}
      <div className="absolute inset-0 opacity-25" style={{ background: "var(--gradient-gold)" }} />
      {/* Pulsing glow ring */}
      <div className="absolute inset-0 rounded-xl border border-primary/50 animate-pulse" />
      {/* Content */}
      <div className="relative px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none shrink-0 mt-0.5 drop-shadow-[0_0_8px_oklch(0.85_0.18_85)]">
            {emoji}
          </span>
          <div>
            <p className="text-sm sm:text-[15px] leading-relaxed font-medium text-foreground/95">
              {text}
            </p>
          </div>
        </div>
        {/* Subtle sparkle dots */}
        <div className="absolute top-3 right-4 flex gap-1 opacity-40">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full animate-ping"
              style={{
                background: "var(--gradient-gold)",
                animationDelay: `${i * 0.4}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
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
