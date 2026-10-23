import { redirect } from "next/navigation";
import TvDashboardClient from "./TvDashboardClient";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function TvDashboardPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const expected = process.env.TV_DASHBOARD_TOKEN;

  if (!expected || !token || token !== expected) {
    redirect("/");
  }

  return <TvDashboardClient token={token} />;
}
