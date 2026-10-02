import type { ReactElement } from "react";
import { toNullableString } from "@/lib/nullable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useOrder } from "../api";

interface OrderDetailDialogProps {
  orderId?: string;
  onClose: () => void;
}

export function OrderDetailDialog({
  orderId,
  onClose,
}: OrderDetailDialogProps) {
  const { data: order, isLoading, isError } = useOrder(orderId);
  return (
    <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order details</DialogTitle>
          <DialogDescription>
            {order?.trackingCode ?? "Loading order information"}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : isError || !order ? (
          <EmptyState
            title="Could not load order"
            description="The order details are unavailable."
          />
        ) : (
          <div className="max-h-[calc(100vh-13rem)] overflow-y-auto supports-[height:100dvh]:max-h-[calc(100dvh-13rem)]">
            <div className="flex flex-col gap-5">
              <DetailSection title="Order">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail label="Tracking code" value={order.trackingCode} />
                  <Detail
                    label="Status"
                    value={
                      <Badge
                        variant={
                          order.status === "DELIVERED"
                            ? "default"
                            : order.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    }
                  />
                  <Detail label="Created" value={formatDate(order.createdAt)} />
                  <Detail label="Township" value={order.townshipName} />
                </div>
              </DetailSection>

              <DetailSection title="Customer & shop">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail label="Shop" value={order.shopName} />
                  <Detail label="Customer" value={order.customerName} />
                  <Detail
                    label="Customer phone"
                    value={toNullableString(order.customerPhone ?? null) || "—"}
                  />
                  <div className="sm:col-span-2">
                    <Detail
                      label="Customer address"
                      value={
                        toNullableString(order.customerAddress ?? null) || "—"
                      }
                    />
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Delivery">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail
                    label="Assigned rider"
                    value={toNullableString(order.riderName ?? null) || "—"}
                  />
                  <Detail
                    label="Rider phone"
                    value={toNullableString(order.riderPhone ?? null) || "—"}
                  />
                  <Detail label="Delivery fee" value={order.deliveryFee} />
                  <Detail label="COD amount" value={order.codAmount} />
                </div>
              </DetailSection>

              <DetailSection title="Package & notes">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Detail
                    label="Package"
                    value={formatPackageInfo(order.packageInfo?.description)}
                  />
                  <Detail
                    label="Notes"
                    value={toNullableString(order.notes ?? null) || "—"}
                  />
                </div>
              </DetailSection>

              <section>
                <h3 className="mb-3 border-b pb-2 text-sm font-semibold">
                  Order history
                </h3>
                <ol className="flex flex-col gap-2 border-l pl-4">
                  {order.history.map((event) => (
                    <li key={event.id} className="text-sm">
                      <span className="font-medium">{event.toStatus}</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(event.createdAt))}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactElement;
}) {
  return (
    <section>
      <h3 className="mb-3 border-b pb-2 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined | ReactElement;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="break-words text-sm">{value}</div>
    </div>
  );
}

function formatPackageInfo(
  value: Record<string, never> | null | undefined,
): string {
  return value ? value.toString() : "—";
}
