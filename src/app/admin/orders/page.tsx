import { fetchOrders } from "@/app/lib/data";
import OrdersTable, { type AdminOrderRow } from "@/app/ui/admin/orders-table";

export default async function OrdersPage() {
  const orders = await fetchOrders();
  const tableOrders: AdminOrderRow[] = orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    postalCode: order.postalCode,
    country: order.country,
    status: order.status,
    trackingNumber: order.trackingNumber,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="w-full">
      <h1 className="mb-8 text-2xl font-bold">Orders</h1>
      <OrdersTable orders={tableOrders} />
    </div>
  );
}
