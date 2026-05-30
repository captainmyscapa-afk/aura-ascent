import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { AppShell } from "@/components/aurum/AppShell";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { Calendar as CalendarIcon, MapPin, Clock, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import type { IndustryId } from "@/lib/industry/types";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

type CalendarEvent = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  industry: IndustryId | "all";
  description: string;
  contentPrepWeeks: number;
  url?: string;
};

const EVENTS: CalendarEvent[] = [
  {
    id: "boot-dusseldorf-2027",
    title: "boot Düsseldorf",
    location: "Düsseldorf, Germany",
    startDate: "2027-01-23",
    endDate: "2027-02-01",
    industry: "yachts",
    description:
      "The world's largest indoor boat show. 1,500+ exhibitors, 214,000 visitors across 16 halls. Premier European networking event.",
    contentPrepWeeks: 4,
    url: "https://www.boot.de",
  },
  {
    id: "miami-boat-2027",
    title: "Miami International Boat Show",
    location: "Miami Beach, USA",
    startDate: "2027-02-11",
    endDate: "2027-02-17",
    industry: "yachts",
    description:
      "100,000+ visitors, largest motor yacht showcase in the Americas. Critical for US charter market networking.",
    contentPrepWeeks: 4,
    url: "https://www.miamiboatshow.com",
  },
  {
    id: "dubai-boat-2027",
    title: "Dubai International Boat Show",
    location: "Dubai Marina, UAE",
    startDate: "2027-03-04",
    endDate: "2027-03-08",
    industry: "yachts",
    description:
      "Middle East's premier marine event. 1,000+ brands, 200+ boats. Key for UHNW Middle Eastern buyer relationships.",
    contentPrepWeeks: 4,
    url: "https://www.dubaiboatshow.com",
  },
  {
    id: "palm-beach-2027",
    title: "Palm Beach International Boat Show",
    location: "Palm Beach, USA",
    startDate: "2027-03-25",
    endDate: "2027-03-28",
    industry: "yachts",
    description:
      "Exclusive boutique show attracting the right clientele. Superyachts along Flagler Drive in a curated setting.",
    contentPrepWeeks: 3,
    url: "https://www.pbboatshow.com",
  },
  {
    id: "myba-2026",
    title: "MYBA Charter Show",
    location: "Sanremo, Italy",
    startDate: "2026-04-27",
    endDate: "2026-04-30",
    industry: "yachts",
    description:
      "Trade-only charter show marking the start of the Mediterranean season. 500+ exhibitors, 80+ yachts from 16-90m.",
    contentPrepWeeks: 3,
    url: "https://www.mybashow.com",
  },
  {
    id: "palma-boat-2026",
    title: "Palma International Boat Show",
    location: "Palma de Mallorca, Spain",
    startDate: "2026-04-29",
    endDate: "2026-05-02",
    industry: "yachts",
    description:
      "Strategic pre-season show. Superyacht Village showcases 24m+ vessels. Ideal for charter and brokerage mandates.",
    contentPrepWeeks: 3,
    url: "https://www.palmainternationalboatshow.com",
  },
  {
    id: "medys-2026",
    title: "Mediterranean Yacht Show",
    location: "Nafplio, Greece",
    startDate: "2026-05-02",
    endDate: "2026-05-06",
    industry: "yachts",
    description:
      "The world's largest crewed charter show. Focus on fleet quality and crew standards ahead of the Med season.",
    contentPrepWeeks: 3,
    url: "https://www.mediterraneanyachtshow.gr",
  },
  {
    id: "world-superyacht-awards-2026",
    title: "World Superyacht Awards",
    location: "Venice, Italy",
    startDate: "2026-05-01",
    endDate: "2026-05-02",
    industry: "yachts",
    description:
      "The most prestigious awards in yachting. Industry leaders, shipyards, and designers gathered in Venice.",
    contentPrepWeeks: 2,
    url: "https://www.boatinternational.com",
  },
  {
    id: "venice-boat-2026",
    title: "Venice Boat Show",
    location: "Venice, Italy",
    startDate: "2026-05-01",
    endDate: "2026-05-03",
    industry: "yachts",
    description:
      "Boutique Italian show in a unique setting. Charter and brokerage networking against Venice's iconic backdrop.",
    contentPrepWeeks: 2,
  },
  {
    id: "tyba-2026",
    title: "TYBA Charter Show",
    location: "Gocek Marina, Turkey",
    startDate: "2026-05-07",
    endDate: "2026-05-11",
    industry: "yachts",
    description:
      "Leading Eastern Mediterranean charter show. Turkish Riviera fleet showcase for Aegean season mandates.",
    contentPrepWeeks: 3,
    url: "https://www.tybachartershow.com",
  },
  {
    id: "superyacht-design-fest-2026",
    title: "Superyacht Design Festival",
    location: "Kitzbuhel, Austria",
    startDate: "2026-06-15",
    endDate: "2026-06-17",
    industry: "yachts",
    description:
      "Two-day event bringing together superyacht industry leaders and luxury community for talks and networking.",
    contentPrepWeeks: 3,
    url: "https://www.boatinternational.com",
  },
  {
    id: "newport-charter-2026",
    title: "Newport Charter Yacht Show",
    location: "Newport, Rhode Island, USA",
    startDate: "2026-06-22",
    endDate: "2026-06-25",
    industry: "yachts",
    description:
      "East Coast's premier charter show. Brokers and UHNW clients inspect summer charter fleet in New England.",
    contentPrepWeeks: 3,
  },
  {
    id: "cyf-2026",
    title: "Cannes Yachting Festival",
    location: "Cannes, France",
    startDate: "2026-09-08",
    endDate: "2026-09-13",
    industry: "yachts",
    description:
      "Europe's largest in-water boat show. 700+ yachts, 50,000 visitors. Essential for charter and brokerage networking.",
    contentPrepWeeks: 4,
    url: "https://www.cannesyachtingfestival.com",
  },
  {
    id: "mys-2026",
    title: "Monaco Yacht Show",
    location: "Port Hercule, Monaco",
    startDate: "2026-09-23",
    endDate: "2026-09-26",
    industry: "yachts",
    description:
      "The world's premier superyacht event. 120+ superyachts, 560 exhibitors. The most important week in brokerage.",
    contentPrepWeeks: 6,
    url: "https://www.monacoyachtshow.com",
  },
  {
    id: "croya-2026",
    title: "CROYA Charter Show",
    location: "Antibes, France",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    industry: "yachts",
    description:
      "Cote d'Azur charter show bridging summer and winter seasons. French Riviera brokers and UHNW clients.",
    contentPrepWeeks: 3,
  },
  {
    id: "flibs-2026",
    title: "Fort Lauderdale Boat Show",
    location: "Fort Lauderdale, USA",
    startDate: "2026-10-28",
    endDate: "2026-11-01",
    industry: "yachts",
    description: "The world's largest in-water boat show. $4B+ in yachts across 6 miles of floating docks.",
    contentPrepWeeks: 4,
    url: "https://www.flibs.com",
  },
  {
    id: "usvi-charter-2026",
    title: "USVI Charter Yacht Show",
    location: "St Thomas, US Virgin Islands",
    startDate: "2026-11-05",
    endDate: "2026-11-08",
    industry: "yachts",
    description:
      "Premier Caribbean charter show. Brokers evaluate yachts ahead of winter season in a tropical setting.",
    contentPrepWeeks: 3,
  },
  {
    id: "metstrade-2026",
    title: "Metstrade",
    location: "Amsterdam, Netherlands",
    startDate: "2026-11-17",
    endDate: "2026-11-19",
    industry: "yachts",
    description:
      "World's largest marine equipment trade show. 1,700 exhibitors, Superyacht Forum. Essential for refit professionals.",
    contentPrepWeeks: 3,
    url: "https://www.metstrade.com",
  },
  {
    id: "explorer-summit-2026",
    title: "Explorer Yachts Summit",
    location: "Amsterdam, Netherlands",
    startDate: "2026-11-16",
    endDate: "2026-11-16",
    industry: "yachts",
    description:
      "The only international summit dedicated to explorer yachting. Owners, captains and adventurers on one stage.",
    contentPrepWeeks: 2,
    url: "https://www.boatinternational.com",
  },
  {
    id: "antigua-charter-2026",
    title: "Antigua Charter Yacht Show",
    location: "Antigua, Caribbean",
    startDate: "2026-12-04",
    endDate: "2026-12-09",
    industry: "yachts",
    description:
      "Industry-only show at Nelson's Dockyard. Opens the Caribbean charter season. Key for winter mandate pipeline.",
    contentPrepWeeks: 3,
  },
  {
    id: "rise-expo-2027",
    title: "RISE Expo Dubai",
    location: "Dubai, UAE",
    startDate: "2027-01-13",
    endDate: "2027-01-15",
    industry: "villas",
    description: "Real estate and investments expo. Trophy developers and UHNW investors in the Gulf's premier market.",
    contentPrepWeeks: 3,
  },
  {
    id: "mipim-2027",
    title: "MIPIM",
    location: "Cannes, France",
    startDate: "2027-03-15",
    endDate: "2027-03-19",
    industry: "villas",
    description:
      "The world's premier real estate event. 20,000+ professionals, 90 countries. Trophy deals and UHNW investor meetings.",
    contentPrepWeeks: 6,
    url: "https://www.mipim.com",
  },
  {
    id: "knight-frank-2026",
    title: "Knight Frank Wealth Report Launch",
    location: "London, UK",
    startDate: "2026-03-04",
    endDate: "2026-03-04",
    industry: "villas",
    description:
      "Annual ultra-prime market intelligence launch. Sets the narrative for UHNW real estate investment globally.",
    contentPrepWeeks: 1,
    url: "https://www.knightfrank.com",
  },
  {
    id: "sothebys-realty-2026",
    title: "Sotheby's International Realty Summit",
    location: "Miami, USA",
    startDate: "2026-03-10",
    endDate: "2026-03-12",
    industry: "villas",
    description: "Global luxury broker summit. Ultra-prime market intelligence and UHNW referral network building.",
    contentPrepWeeks: 3,
    url: "https://www.sothebysrealty.com",
  },
  {
    id: "gulf-re-awards-2026",
    title: "Gulf Real Estate Awards",
    location: "Dubai, UAE",
    startDate: "2026-04-15",
    endDate: "2026-04-16",
    industry: "villas",
    description:
      "Recognising excellence across Gulf trophy real estate. Developer principals and UHNW investor networking.",
    contentPrepWeeks: 2,
  },
  {
    id: "milken-2026",
    title: "Milken Institute Global Conference",
    location: "Beverly Hills, USA",
    startDate: "2026-05-04",
    endDate: "2026-05-07",
    industry: "villas",
    description:
      "The most influential investor and wealth forum globally. UHNW real estate deal flow and principal introductions.",
    contentPrepWeeks: 4,
    url: "https://www.milkeninstitute.org",
  },
  {
    id: "christies-re-2026",
    title: "Christie's International Real Estate Summit",
    location: "New York, USA",
    startDate: "2026-05-05",
    endDate: "2026-05-06",
    industry: "villas",
    description:
      "Global luxury broker summit. Trophy property market intelligence and UHNW collector cross-referral network.",
    contentPrepWeeks: 3,
    url: "https://www.christiesrealestate.com",
  },
  {
    id: "cannes-lions-2026",
    title: "Cannes Lions",
    location: "Cannes, France",
    startDate: "2026-06-22",
    endDate: "2026-06-26",
    industry: "villas",
    description:
      "Global brand leadership festival. UHNW network overlap — luxury real estate visibility play for top brokers.",
    contentPrepWeeks: 3,
    url: "https://www.canneslions.com",
  },
  {
    id: "inman-luxury-2026",
    title: "Inman Luxury Connect",
    location: "San Diego, USA",
    startDate: "2026-07-27",
    endDate: "2026-07-28",
    industry: "villas",
    description:
      "Premier luxury real estate industry leadership forum. Top brokers, developers and UHNW market intelligence.",
    contentPrepWeeks: 3,
    url: "https://www.inman.com",
  },
  {
    id: "rics-2026",
    title: "RICS World Built Environment Forum",
    location: "London, UK",
    startDate: "2026-09-14",
    endDate: "2026-09-15",
    industry: "villas",
    description:
      "Global professional standards and prime market outlook. Key for positioning in ultra-prime UK and European markets.",
    contentPrepWeeks: 3,
    url: "https://www.rics.org",
  },
  {
    id: "palexpo-2026",
    title: "Salon International de l'Immobilier",
    location: "Geneva, Switzerland",
    startDate: "2026-09-24",
    endDate: "2026-09-27",
    industry: "villas",
    description:
      "Swiss international property salon. Ultra-prime Alpine, Monaco and Mediterranean listings for UHNW buyers.",
    contentPrepWeeks: 3,
  },
  {
    id: "expo-real-2026",
    title: "Expo Real Munich",
    location: "Munich, Germany",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    industry: "villas",
    description:
      "Europe's leading real estate trade fair. 40,000+ attendees, 2,000+ exhibitors. Prime European market deals.",
    contentPrepWeeks: 4,
    url: "https://www.exporeal.net",
  },
  {
    id: "uli-2026",
    title: "ULI Fall Meeting",
    location: "Las Vegas, USA",
    startDate: "2026-10-19",
    endDate: "2026-10-22",
    industry: "villas",
    description:
      "Urban Land Institute annual gathering. Trophy development pipeline and prime market outlook for operators.",
    contentPrepWeeks: 3,
    url: "https://www.uli.org",
  },
  {
    id: "world-luxury-expo-2026",
    title: "World Luxury Expo",
    location: "Abu Dhabi, UAE",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    industry: "villas",
    description:
      "Invitation-only luxury exhibition for UHNW individuals. Trophy real estate, private aviation and fine art.",
    contentPrepWeeks: 3,
  },
  {
    id: "cityscape-dubai-2026",
    title: "Cityscape Dubai",
    location: "Dubai, UAE",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    industry: "villas",
    description: "MENA's largest real estate event. Trophy developers, UHNW investors and branded residence launches.",
    contentPrepWeeks: 4,
    url: "https://www.cityscape.com",
  },
  {
    id: "monaco-property-2026",
    title: "Monaco Property Days",
    location: "Monaco",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    industry: "villas",
    description: "Private wealth managers and developer principals. Two-day ultra-prime market networking event.",
    contentPrepWeeks: 3,
  },
  {
    id: "sime-miami-2026",
    title: "SIME Miami",
    location: "Miami, USA",
    startDate: "2026-11-18",
    endDate: "2026-11-20",
    industry: "villas",
    description:
      "South Florida's premier luxury real estate summit. Waterfront trophy properties and UHNW buyer mandates.",
    contentPrepWeeks: 3,
  },
  {
    id: "iltm-2026",
    title: "ILTM Cannes",
    location: "Cannes, France",
    startDate: "2026-11-30",
    endDate: "2026-12-03",
    industry: "villas",
    description:
      "International Luxury Travel Market. 85,000 pre-scheduled meetings. Branded residences and luxury hospitality deals.",
    contentPrepWeeks: 4,
    url: "https://www.iltm.com",
  },
  {
    id: "leading-re-2027",
    title: "LeadingRE Luxury Summit",
    location: "Las Vegas, USA",
    startDate: "2027-03-22",
    endDate: "2027-03-24",
    industry: "villas",
    description: "Leadership and luxury real estate summit. Top producing brokers and UHNW market strategy sessions.",
    contentPrepWeeks: 3,
    url: "https://www.leadingre.com",
  },
  {
    id: "dubai-property-2027",
    title: "Dubai Luxury Property Show",
    location: "Dubai, UAE",
    startDate: "2027-02-20",
    endDate: "2027-02-22",
    industry: "villas",
    description: "Trophy listings, Palm Jumeirah developers and branded residence teams. UHNW buyer pipeline event.",
    contentPrepWeeks: 3,
  },
  {
    id: "nac-2026",
    title: "NAFA Aviation Forum",
    location: "Miami, USA",
    startDate: "2026-02-10",
    endDate: "2026-02-12",
    industry: "jets",
    description: "Aviation finance and pre-owned market outlook. Key for understanding aircraft valuation cycles.",
    contentPrepWeeks: 3,
    url: "https://www.nafa.aero",
  },
  {
    id: "asian-biz-av-2026",
    title: "Asian Business Aviation Conference",
    location: "Shanghai, China",
    startDate: "2026-03-24",
    endDate: "2026-03-26",
    industry: "jets",
    description:
      "Asia Pacific's premier business aviation event. UHNW Chinese and Asian buyer relationships and fleet orders.",
    contentPrepWeeks: 4,
    url: "https://www.abace.aero",
  },
  {
    id: "avbuyer-2026",
    title: "AvBuyer Aircraft Summit",
    location: "London, UK",
    startDate: "2026-03-17",
    endDate: "2026-03-18",
    industry: "jets",
    description: "Pre-owned aircraft market intelligence summit. Buyer and broker strategies for the current cycle.",
    contentPrepWeeks: 2,
    url: "https://www.avbuyer.com",
  },
  {
    id: "aero-2026",
    title: "AERO Friedrichshafen",
    location: "Friedrichshafen, Germany",
    startDate: "2026-04-15",
    endDate: "2026-04-18",
    industry: "jets",
    description: "Europe's leading general aviation show. Private aircraft, avionics and operator networking.",
    contentPrepWeeks: 3,
    url: "https://www.aero-expo.com",
  },
  {
    id: "canbiz-2026",
    title: "CANBIZ Cannes",
    location: "Cannes, France",
    startDate: "2026-04-07",
    endDate: "2026-04-09",
    industry: "jets",
    description: "Boutique private aviation show on the Cote d'Azur. UHNW charter clients and Mediterranean operators.",
    contentPrepWeeks: 3,
  },
  {
    id: "corporate-jet-investor-2026",
    title: "Corporate Jet Investor",
    location: "New York, USA",
    startDate: "2026-04-28",
    endDate: "2026-04-29",
    industry: "jets",
    description:
      "Finance and investment forum for business aviation assets. Aircraft as investment vehicles — UHNW angle.",
    contentPrepWeeks: 3,
    url: "https://www.corporatejetinvestor.com",
  },
  {
    id: "ebace-2026",
    title: "EBACE Geneva",
    location: "Geneva, Switzerland",
    startDate: "2026-05-19",
    endDate: "2026-05-21",
    industry: "jets",
    description: "Europe's premier business aviation event. OEMs, brokers, operators and UHNW buyers all in one place.",
    contentPrepWeeks: 4,
    url: "https://www.ebace.aero",
  },
  {
    id: "cahf-2026",
    title: "Corporate Aviation Hospitality Forum",
    location: "Monaco",
    startDate: "2026-06-04",
    endDate: "2026-06-05",
    industry: "jets",
    description:
      "Boutique aviation and UHNW hospitality crossover forum during Monaco Grand Prix week. Elite networking.",
    contentPrepWeeks: 3,
  },
  {
    id: "baa-2026",
    title: "BBGA Forum",
    location: "London, UK",
    startDate: "2026-06-09",
    endDate: "2026-06-10",
    industry: "jets",
    description: "UK business aviation industry forum. Regulatory updates, pre-owned market and operator networking.",
    contentPrepWeeks: 2,
    url: "https://www.bbga.aero",
  },
  {
    id: "farnborough-2026",
    title: "Farnborough Airshow",
    location: "Farnborough, UK",
    startDate: "2026-07-20",
    endDate: "2026-07-26",
    industry: "jets",
    description:
      "One of the world's premier airshows. OEM launches, major aircraft orders and global aviation deal flow.",
    contentPrepWeeks: 5,
    url: "https://www.farnboroughairshow.com",
  },
  {
    id: "aviation-festival-2026",
    title: "Aviation Festival",
    location: "Amsterdam, Netherlands",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    industry: "jets",
    description:
      "Global aviation leadership summit. Airline executives, private operators and aviation technology leaders.",
    contentPrepWeeks: 3,
    url: "https://www.aviation-festival.com",
  },
  {
    id: "jetexpo-2026",
    title: "JetExpo",
    location: "Moscow, Russia",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    industry: "jets",
    description: "Eastern Europe's leading business aviation show. Pre-owned inventory and charter fleet networking.",
    contentPrepWeeks: 3,
    url: "https://www.jetexpo.ru",
  },
  {
    id: "wjet-2026",
    title: "World Jet Forum",
    location: "Geneva, Switzerland",
    startDate: "2026-10-06",
    endDate: "2026-10-07",
    industry: "jets",
    description:
      "Elite private aviation conference. OEM executives, major brokers and UHNW fleet owners on one platform.",
    contentPrepWeeks: 3,
  },
  {
    id: "rotorcraft-2026",
    title: "Rotorcraft Pro Summit",
    location: "Las Vegas, USA",
    startDate: "2026-10-19",
    endDate: "2026-10-19",
    industry: "jets",
    description: "VIP helicopter and rotorcraft summit co-located with NBAA. UHNW short-range transport deal flow.",
    contentPrepWeeks: 2,
  },
  {
    id: "nbaa-2026",
    title: "NBAA-BACE",
    location: "Las Vegas, USA",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    industry: "jets",
    description:
      "The world's most powerful business aviation event. 1,000+ exhibitors, 80+ aircraft on static display.",
    contentPrepWeeks: 6,
    url: "https://nbaa.org",
  },
  {
    id: "charter-broker-2026",
    title: "Air Charter Association Summit",
    location: "London, UK",
    startDate: "2026-11-03",
    endDate: "2026-11-04",
    industry: "jets",
    description:
      "Charter broker industry summit. Market intelligence, compliance updates and UHNW client acquisition strategies.",
    contentPrepWeeks: 3,
    url: "https://www.aircharterassociation.org",
  },
  {
    id: "mebaa-2026",
    title: "MEBAA Show",
    location: "Dubai, UAE",
    startDate: "2026-12-08",
    endDate: "2026-12-10",
    industry: "jets",
    description: "Middle East business aviation show. UHNW Gulf buyer relationships and fleet deals.",
    contentPrepWeeks: 4,
    url: "https://www.mebaa.aero",
  },
  {
    id: "heli-expo-2027",
    title: "HAI Heli-Expo",
    location: "Dallas, USA",
    startDate: "2027-03-06",
    endDate: "2027-03-09",
    industry: "jets",
    description: "World's largest helicopter show. Charter operators, private owners and VIP transport specialists.",
    contentPrepWeeks: 3,
    url: "https://www.rotor.org",
  },
  {
    id: "dubai-airshow-2027",
    title: "Dubai Airshow",
    location: "Dubai, UAE",
    startDate: "2027-11-17",
    endDate: "2027-11-21",
    industry: "jets",
    description:
      "Middle East's premier aerospace event. Private jets, OEM launches and UHNW buyer networking at scale.",
    contentPrepWeeks: 6,
    url: "https://www.dubaiairshow.aero",
  },
  {
    id: "retromobile-2027",
    title: "Retromobile",
    location: "Paris, France",
    startDate: "2027-02-03",
    endDate: "2027-02-08",
    industry: "cars",
    description:
      "Paris' legendary winter collector car show. World's rarest cars for sale and at auction. Opens the European season.",
    contentPrepWeeks: 4,
    url: "https://www.retromobile.com",
  },
  {
    id: "amelia-island-2026",
    title: "Amelia Island Concours",
    location: "Amelia Island, USA",
    startDate: "2026-03-05",
    endDate: "2026-03-08",
    industry: "cars",
    description: "Premier East Coast concours. $111M+ in collector cars auctioned. Broad Arrow and Gooding on-site.",
    contentPrepWeeks: 4,
    url: "https://www.ameliaconcours.com",
  },
  {
    id: "goodwood-members-2026",
    title: "Goodwood Members' Meeting",
    location: "Goodwood, UK",
    startDate: "2026-04-18",
    endDate: "2026-04-19",
    industry: "cars",
    description: "Intimate invitation-only historic racing weekend. The most exclusive event in the Goodwood calendar.",
    contentPrepWeeks: 3,
    url: "https://www.goodwood.com",
  },
  {
    id: "top-marques-2026",
    title: "Top Marques Monaco",
    location: "Monaco",
    startDate: "2026-05-06",
    endDate: "2026-05-10",
    industry: "cars",
    description:
      "World's most exclusive supercar show. New hypercar launches and ultra-luxury product debuts in Monaco.",
    contentPrepWeeks: 3,
    url: "https://www.topmarquesmonaco.com",
  },
  {
    id: "villa-deste-2026",
    title: "Concorso d'Eleganza Villa d'Este",
    location: "Lake Como, Italy",
    startDate: "2026-05-15",
    endDate: "2026-05-17",
    industry: "cars",
    description:
      "The world's most prestigious concours on Lake Como. Invitation-only. Collector and OEM networking at its finest.",
    contentPrepWeeks: 4,
    url: "https://www.bmw-groupclassiccars.com",
  },
  {
    id: "rm-monaco-2026",
    title: "RM Sotheby's Monaco",
    location: "Monaco",
    startDate: "2026-05-20",
    endDate: "2026-05-21",
    industry: "cars",
    description:
      "Blue-chip automobile auction at Grimaldi Forum. Racing pedigree and iconic cars in the French Riviera setting.",
    contentPrepWeeks: 3,
    url: "https://rmsothebys.com",
  },
  {
    id: "le-mans-classic-2026",
    title: "Le Mans Classic",
    location: "Le Mans, France",
    startDate: "2026-07-03",
    endDate: "2026-07-06",
    industry: "cars",
    description: "Historic racers relive the 24 Hours. Artcurial auction on-site. Elite collector networking.",
    contentPrepWeeks: 4,
    url: "https://www.lemansclassic.com",
  },
  {
    id: "goodwood-fos-2026",
    title: "Goodwood Festival of Speed",
    location: "Goodwood, UK",
    startDate: "2026-07-09",
    endDate: "2026-07-12",
    industry: "cars",
    description:
      "The world's greatest motorsport garden party. 200,000 attendees, new car launches, collector networking.",
    contentPrepWeeks: 4,
    url: "https://www.goodwood.com",
  },
  {
    id: "rm-monterey-2026",
    title: "RM Sotheby's Monterey",
    location: "Pebble Beach, USA",
    startDate: "2026-08-12",
    endDate: "2026-08-12",
    industry: "cars",
    description: "Flagship collector car auction of Monterey Car Week. Trophy lots above $2M.",
    contentPrepWeeks: 4,
    url: "https://rmsothebys.com",
  },
  {
    id: "quail-2026",
    title: "The Quail Motorsports Gathering",
    location: "Carmel, USA",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    industry: "cars",
    description:
      "The most exclusive event of Monterey Car Week. Invitation-only. OEM debuts and UHNW collector networking.",
    contentPrepWeeks: 4,
    url: "https://www.quailmotorsportsgathering.com",
  },
  {
    id: "pebble-beach-2026",
    title: "Pebble Beach Concours",
    location: "Pebble Beach, USA",
    startDate: "2026-08-16",
    endDate: "2026-08-16",
    industry: "cars",
    description: "75th anniversary of the world's premier collector car competition. Full week Aug 12-17.",
    contentPrepWeeks: 6,
    url: "https://www.pebblebeachconcours.net",
  },
  {
    id: "salon-prive-2026",
    title: "Salon Prive",
    location: "Blenheim Palace, UK",
    startDate: "2026-09-02",
    endDate: "2026-09-05",
    industry: "cars",
    description:
      "Britain's most prestigious concours at Blenheim Palace. Invitation-only. Hypercar debuts and UHNW networking.",
    contentPrepWeeks: 3,
    url: "https://www.salonprivelondon.com",
  },
  {
    id: "goodwood-revival-2026",
    title: "Goodwood Revival",
    location: "Goodwood, UK",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    industry: "cars",
    description:
      "World's greatest historic motor racing event. Period dress, classic cars and elite collector networking.",
    contentPrepWeeks: 3,
    url: "https://www.goodwood.com",
  },
  {
    id: "paris-motor-2026",
    title: "Paris Motor Show",
    location: "Paris, France",
    startDate: "2026-10-15",
    endDate: "2026-10-25",
    industry: "cars",
    description:
      "One of the world's most prestigious motor shows. Hypercar launches, concept reveals and luxury brand debuts.",
    contentPrepWeeks: 5,
    url: "https://www.mondial.paris",
  },
  {
    id: "rm-london-2026",
    title: "RM Sotheby's London",
    location: "London, UK",
    startDate: "2026-10-31",
    endDate: "2026-10-31",
    industry: "cars",
    description:
      "RM Sotheby's flagship European sale. Trophy lots from 500K to 5M+. Key collector and broker networking.",
    contentPrepWeeks: 3,
    url: "https://rmsothebys.com",
  },
  {
    id: "concorso-italiano-2026",
    title: "Concorso Italiano",
    location: "Monterey, USA",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    industry: "cars",
    description:
      "Celebrating Italian automotive excellence during Monterey Car Week. Ferrari, Lamborghini and Alfa collectors.",
    contentPrepWeeks: 3,
    url: "https://www.concorsoitaliano.com",
  },
  {
    id: "bonhams-scottsdale-2027",
    title: "Bonhams Scottsdale Auction",
    location: "Scottsdale, USA",
    startDate: "2027-01-16",
    endDate: "2027-01-16",
    industry: "cars",
    description:
      "Opens the US collector car auction calendar. Blue-chip European classics and American muscle at auction.",
    contentPrepWeeks: 3,
    url: "https://www.bonhams.com",
  },
  {
    id: "cavallino-2027",
    title: "Cavallino Classic",
    location: "Palm Beach, USA",
    startDate: "2027-01-22",
    endDate: "2027-01-26",
    industry: "cars",
    description:
      "Deep-dive into Ferrari heritage. Auctions, marque displays and panel discussions in Florida sunshine.",
    contentPrepWeeks: 3,
    url: "https://www.cavallino.com",
  },
  {
    id: "artcurial-2027",
    title: "Artcurial Retromobile Auction",
    location: "Paris, France",
    startDate: "2027-02-05",
    endDate: "2027-02-06",
    industry: "cars",
    description: "Artcurial's flagship Paris sale at Retromobile. French marques and European classics at auction.",
    contentPrepWeeks: 3,
    url: "https://www.artcurial.com",
  },
  {
    id: "ice-st-moritz-2027",
    title: "The I.C.E. St. Moritz",
    location: "St. Moritz, Switzerland",
    startDate: "2027-02-14",
    endDate: "2027-02-14",
    industry: "cars",
    description:
      "Classic cars glide across the frozen lake of St. Moritz. High style, collector networking in a unique winter setting.",
    contentPrepWeeks: 3,
    url: "https://www.theice.ch",
  },
];

const INDUSTRY_COLORS: Record<string, string> = {
  yachts: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  villas: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  jets: "text-violet-400 border-violet-400/40 bg-violet-400/10",
  cars: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  all: "text-primary border-primary/40 bg-primary/10",
};

const INDUSTRY_DOT: Record<string, string> = {
  yachts: "bg-blue-400",
  villas: "bg-emerald-400",
  jets: "bg-violet-400",
  cars: "bg-orange-400",
  all: "bg-primary",
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(dateStr);
  event.setHours(0, 0, 0, 0);
  return Math.ceil((event.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMonth(dateStr: string): number {
  return new Date(dateStr).getMonth();
}

function getYear(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function CalendarPage() {
  const { industryId } = useIndustry();
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const filtered = EVENTS.filter((e) => filter === "all" || e.industry === filter).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const upcoming = filtered.filter((e) => daysUntil(e.endDate) >= 0);
  const past = filtered.filter((e) => daysUntil(e.endDate) < 0);

  const monthEvents = EVENTS.filter((e) => {
    if (filter !== "all" && e.industry !== filter) return false;
    return getMonth(e.startDate) === viewMonth && getYear(e.startDate) === viewYear;
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AURUM · EVENT INTELLIGENCE</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            The luxury calendar. Every major event across yachting, property, aviation and automotive — with content
            prep windows so you show up already known.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "yachts", "villas", "jets", "cars"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full border text-xs tracking-[0.2em] uppercase transition-all ${filter === f ? INDUSTRY_COLORS[f] : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {f === "all" ? "All industries" : f}
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Event list */}
          <div className="lg:col-span-2 space-y-6">
            {upcoming.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  UPCOMING
                </h2>
                <div className="space-y-3">
                  {upcoming.map((e) => {
                    const days = daysUntil(e.startDate);
                    const prepStart = new Date(e.startDate);
                    prepStart.setDate(prepStart.getDate() - e.contentPrepWeeks * 7);
                    const prepDays = daysUntil(prepStart.toISOString().slice(0, 10));
                    const isPrep = prepDays <= 0 && days > 0;
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className={`w-full text-left glass rounded-xl p-5 hover:ring-gold transition-all ${selectedEvent?.id === e.id ? "ring-1 ring-primary/50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${INDUSTRY_DOT[e.industry]}`} />
                              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                                {e.industry === "all" ? "ALL" : e.industry.toUpperCase()}
                              </span>
                              {isPrep && (
                                <span className="text-[10px] tracking-[0.15em] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                  POST NOW
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-base leading-tight">{e.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {e.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateShort(e.startDate)}
                                {e.startDate !== e.endDate && ` - ${formatDateShort(e.endDate)}`}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold tabular-nums">{days}</div>
                            <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                              days away
                            </div>
                          </div>
                        </div>
                        {/* Content prep strip */}
                        <div
                          className={`mt-3 pt-3 border-t text-xs space-y-1 ${isPrep ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground"}`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Content prep: {e.contentPrepWeeks} weeks before
                          </div>
                          <div className="pl-5">
                            {prepDays > 0 && `Start posting in ${prepDays}d`}
                            {prepDays <= 0 && days > 0 && `Content window open now`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground">PAST</h2>
                <div className="space-y-2">
                  {past.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="w-full text-left p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(e.startDate)} · {e.location}
                          </div>
                        </div>
                        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground shrink-0">
                          Passed
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calendar + detail */}
          <div className="space-y-6">
            {/* Mini calendar */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-primary/10 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-primary/10 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {monthEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No events this month</p>
              ) : (
                <div className="space-y-2">
                  {monthEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${selectedEvent?.id === e.id ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/30"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${INDUSTRY_DOT[e.industry]}`} />
                        <span className="text-xs font-medium truncate">{e.title}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 pl-3.5">
                        {formatDateShort(e.startDate)}
                        {e.startDate !== e.endDate && ` - ${formatDateShort(e.endDate)}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected event detail */}
            {selectedEvent ? (
              <div className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${INDUSTRY_DOT[selectedEvent.industry]}`} />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    {selectedEvent.industry === "all" ? "ALL" : selectedEvent.industry.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedEvent.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {formatDate(selectedEvent.startDate)}
                    {selectedEvent.startDate !== selectedEvent.endDate && ` - ${formatDate(selectedEvent.endDate)}`}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    CONTENT PREP WINDOW
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Start posting {selectedEvent.contentPrepWeeks} weeks before the event.
                  </p>
                  <div className="text-xs">
                    {(() => {
                      const prepStart = new Date(selectedEvent.startDate);
                      prepStart.setDate(prepStart.getDate() - selectedEvent.contentPrepWeeks * 7);
                      const days = daysUntil(prepStart.toISOString().slice(0, 10));
                      if (days > 0)
                        return `Content window opens in ${days} days — ${formatDate(prepStart.toISOString().slice(0, 10))}`;
                      if (daysUntil(selectedEvent.startDate) > 0)
                        return `Content window is open right now. Start posting today.`;
                      return "This event has passed.";
                    })()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to="/studio"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Create content for this event
                  </Link>
                  {selectedEvent.url && (
                    <a
                      href={selectedEvent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:border-primary/40 transition-colors"
                    >
                      Visit official site
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass rounded-xl p-8 text-center space-y-3">
                <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <div className="font-medium">Select an event</div>
                <p className="text-sm text-muted-foreground">
                  Click any event to see details, content prep timing and create posts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
