import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Check, Calendar, Compass, Radio, ChevronRight, Hotel, Lock, RefreshCw, MapPin, ChevronLeft } from "lucide-react";
import React from "react";
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

  const [calFilter, setCalFilter] = React.useState<string>(industryId);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const calToday = new Date();
  const [viewMonth, setViewMonth] = React.useState(calToday.getMonth());
  const [viewYear, setViewYear] = React.useState(calToday.getFullYear());

  const recFn = useServerFn(generateRecommendation);
  const tasksFn = useServerFn(generateDailyTasks);

  const todayStr = isoDay();

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

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
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

        <aside className="space-y-6 lg:space-y-8 pt-0">
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

      {/* Event Calendar */}
      <div className="mt-10 space-y-6">
        <div className="flex flex-wrap gap-2">
          {(["all", "yachts", "villas", "jets", "cars"] as const).map((f) => (
            <button key={f} onClick={() => setCalFilter(f)} className={"px-4 py-1.5 rounded-full border text-xs tracking-[0.2em] uppercase transition-all " + (calFilter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              {f === "all" ? "All industries" : f}
            </button>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); }} className="p-1 rounded hover:bg-primary/10 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][viewMonth]} {viewYear}</span>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); }} className="p-1 rounded hover:bg-primary/10 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} className="text-center text-[10px] text-muted-foreground/50 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {(() => {
                const firstDay = new Date(viewYear, viewMonth, 1);
                const lastDay = new Date(viewYear, viewMonth + 1, 0);
                const startDow = (firstDay.getDay() + 6) % 7;
                const todayDate = new Date().toISOString().slice(0, 10);
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
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedEvent.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(selectedEvent.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{selectedEvent.startDate !== selectedEvent.endDate && " - " + new Date(selectedEvent.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-primary">
                    <Sparkles className="w-3.5 h-3.5" />CONTENT PREP WINDOW
                  </div>
                  <p className="text-sm text-muted-foreground">Start posting {selectedEvent.contentPrepWeeks} weeks before the event.</p>
                  <div className="text-xs">
                    {(() => {
                      const prepStart = new Date(selectedEvent.startDate);
                      prepStart.setDate(prepStart.getDate() - selectedEvent.contentPrepWeeks * 7);
                      const diff = Math.ceil((prepStart.getTime() - new Date().setHours(0,0,0,0)) / 86_400_000);
                      if (diff > 0) return "Content window opens in " + diff + " days — " + prepStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      if (Math.ceil((new Date(selectedEvent.startDate).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000) > 0) return "Content window is open right now. Start posting today.";
                      return "This event has passed.";
                    })()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to="/studio" search={{ idea: selectedEvent.title + " — " + selectedEvent.location + ". " + selectedEvent.description, intel: undefined }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                    <Sparkles className="w-3.5 h-3.5" />Create content for this event
                  </Link>
                  {selectedEvent.url && (
                    <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:border-primary/40 transition-colors">
                      Visit official site
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center space-y-3">
                <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <div className="font-medium">Select an event</div>
                <p className="text-sm text-muted-foreground">Click any event on the calendar to see details, content prep timing and create posts.</p>
              </div>
            )}
          </div>
        </div>
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
