import type { BookingRecord } from "../booking/contracts";
import type { CustomerInvoiceSummary } from "./contracts";

export function sortDashboardBookings(bookings: BookingRecord[]) {
  return [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function summarizeCustomerInvoices(invoices: CustomerInvoiceSummary[]) {
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const latestIssuedAt = invoices
    .map((invoice) => invoice.issuedAt)
    .sort()
    .at(-1) || null;

  return {
    count: invoices.length,
    totalAmount,
    latestIssuedAt,
  };
}

export function buildCustomerDashboardSummary(input: {
  bookings: BookingRecord[];
  invoices?: CustomerInvoiceSummary[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const bookings = sortDashboardBookings(input.bookings);
  const upcoming = bookings.filter((booking) => {
    const bookingDate = new Date(`${booking.date}T${String(booking.hour).padStart(2, "0")}:00:00`);
    return bookingDate.getTime() >= now.getTime() && booking.status === "confirmed";
  });
  const past = bookings.filter((booking) => !upcoming.includes(booking));

  return {
    totalBookings: bookings.length,
    upcomingBookings: upcoming.length,
    pastBookings: past.length,
    invoices: summarizeCustomerInvoices(input.invoices || []),
  };
}

export function buildAdminDashboardStats(input: {
  bookings: BookingRecord[];
  usersCount: number;
  leadsCount: number;
  visitorsCount: number;
  conversationsCount: number;
}) {
  return {
    totalBookings: input.bookings.length,
    paidBookings: input.bookings.filter((booking) => booking.paymentStatus === "paid").length,
    refundedBookings: input.bookings.filter((booking) => booking.refundStatus === "succeeded").length,
    usersCount: input.usersCount,
    leadsCount: input.leadsCount,
    visitorsCount: input.visitorsCount,
    conversationsCount: input.conversationsCount,
  };
}
