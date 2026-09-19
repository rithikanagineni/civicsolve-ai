import { db } from "@/db";
import { notificationDeliveries, notifications } from "@/db/schema";

export async function notify(params: {
  userId: number;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
      link: params.link,
    })
    .returning();
  await db.insert(notificationDeliveries).values({ notificationId: row.id, channel: "IN_APP", status: "DELIVERED" });
  return row;
}
