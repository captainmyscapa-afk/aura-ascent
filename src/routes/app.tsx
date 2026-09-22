import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/aurum/DashboardPage";

export const Route = createFileRoute("/app")({
  component: DashboardPage,
});
