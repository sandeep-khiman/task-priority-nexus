
import { Task } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Mock user ID for the current user
export const CURRENT_USER_ID = "user-123";

export const mockTasks: Task[] = [
  {
    id: uuidv4(),
    title: "Implement login functionality",
    notes: "Create login form with validation",
    icon: "lock",
    progress: 60,
    createdById: "user-456",
    createdByName: "Jane Smith",
    assignedToId: CURRENT_USER_ID,
    assignedToName: "Current User",
    dueDate: "2025-05-20",
    completed: false,
    quadrant: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Design dashboard UI",
    notes: "Create wireframes for the dashboard",
    icon: "layout",
    progress: 30,
    createdById: "user-456",
    createdByName: "Jane Smith",
    assignedToId: CURRENT_USER_ID,
    assignedToName: "Current User",
    dueDate: "2025-05-25",
    completed: false,
    quadrant: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Fix navigation bugs",
    notes: "Address issues with responsive navigation",
    icon: "bug",
    progress: 10,
    createdById: "user-789",
    createdByName: "John Doe",
    assignedToId: CURRENT_USER_ID,
    assignedToName: "Current User",
    dueDate: "2025-05-18",
    completed: false,
    quadrant: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: "Update documentation",
    notes: "Review and update API documentation",
    icon: "file-text",
    progress: 80,
    createdById: "user-789",
    createdByName: "John Doe",
    assignedToId: "user-456", // Not assigned to current user
    assignedToName: "Jane Smith",
    dueDate: "2025-05-22",
    completed: false,
    quadrant: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Function to get tasks assigned to a specific user
export const getTasksAssignedToUser = (userId: string): Task[] => {
  return mockTasks.filter(task => task.assignedToId === userId && !task.completed);
};
