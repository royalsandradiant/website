import { fetchOrders } from "@/app/lib/data";
import { buildTrackingLink } from "@/app/lib/shipping-tracking";
import OrdersTable, { type AdminOrderRow } from "@/app/ui/admin/orders-table";

export default async function OrdersPage() {
  const orders = await fetchOrders();
  const tableOrders: AdminOrderRow[] = orders.map((order) => {
    // Detect carrier from tracking number if available
    const carrier = order.trackingNumber
      ? buildTrackingLink(order.trackingNumber).carrierLabel
      : null;

    return {
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
      carrier,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? "Unknown Product",
        quantity: item.quantity,
        price: Number(item.price),
        size: item.size,
        color: item.color,
      })),
    };
  });

  return (
    <div className="w-full">
      <h1 className="mb-8 text-2xl font-bold">Orders</h1>
      <OrdersTable orders={tableOrders} />
    </div>
  );
}
