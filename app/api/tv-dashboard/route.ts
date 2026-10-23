import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.TV_DASHBOARD_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in14Days = new Date(now);
  in14Days.setDate(in14Days.getDate() + 14);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    allOrders,
    totalCustomers,
    newContactRequests,
    pendingReviews,
    revenueAgg,
    totalVisitors,
    todayVisitors,
    weekVisitors,
    monthVisitors,
    dueMaintenance,
    openBillingInvoices,
    openQuotes,
    recentOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { isArchived: false },
      select: { isCompleted: true, status: true, finalPrice: true },
    }),
    prisma.customer.count(),
    prisma.contactRequest.count({ where: { status: "NEW" } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.order.aggregate({
      _sum: { finalPrice: true },
      where: { isCompleted: true },
    }),
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.maintenanceContract.count({
      where: { isActive: true, nextServiceDate: { lte: in14Days } },
    }),
    prisma.billingDocument.count({
      where: { type: "INVOICE", status: { in: ["SENT", "OVERDUE"] } },
    }),
    prisma.invoice.count({
      where: { type: "QUOTE", quoteStatus: "OPEN", isSentToCustomer: true },
    }),
    prisma.order.findMany({
      where: { isArchived: false, isCompleted: false, status: { notIn: ["PICKED_UP", "DELIVERED"] } },
      select: { orderNumber: true, title: true, status: true, customer: { select: { firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const activeOrders = allOrders.filter(
    (o) => !o.isCompleted && o.status !== "PICKED_UP" && o.status !== "DELIVERED"
  ).length;
  const completedOrders = allOrders.filter(
    (o) => o.isCompleted || o.status === "PICKED_UP" || o.status === "DELIVERED"
  ).length;
  const totalOrders = allOrders.length;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const totalRevenue = Number(revenueAgg._sum.finalPrice ?? 0);

  return NextResponse.json({
    activeOrders,
    completedOrders,
    totalOrders,
    completionRate,
    totalRevenue,
    totalCustomers,
    newContactRequests,
    pendingReviews,
    totalVisitors,
    todayVisitors,
    weekVisitors,
    monthVisitors,
    dueMaintenance,
    openBillingInvoices,
    openQuotes,
    recentOrders,
    fetchedAt: now.toISOString(),
  });
}
