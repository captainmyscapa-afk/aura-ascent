import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/aurum/LandingPage";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
