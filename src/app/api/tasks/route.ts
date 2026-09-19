import { handleError, ok } from "@/server/exception/http";
import { requireAuth } from "@/server/security/auth";

type TaskItem = {
  id: number;
  title: string;
  owner: string;
  status: "Open" | "In progress" | "Pending review" | "Awaiting validation" | "Closed";
};

const tasks: TaskItem[] = [
  { id: 1, title: "Accept task", owner: "UrbanIoT Systems", status: "Open" },
  { id: 2, title: "Start work", owner: "Field team", status: "In progress" },
  { id: 3, title: "Submit evidence", owner: "Project lead", status: "Pending review" },
  { id: 4, title: "Verify resolution", owner: "Citizen + moderator", status: "Awaiting validation" },
  { id: 5, title: "Resolved", owner: "All stakeholders", status: "Closed" },
];

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    return ok({ items: tasks });
  } catch (error) {
    return handleError(error);
  }
}
