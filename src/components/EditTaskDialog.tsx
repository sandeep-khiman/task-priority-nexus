import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Edit,
  LucideFileText,
  Users,
  Calendar,
  HelpCircle,
  SoupIcon,
} from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { useTaskContext } from "@/contexts/TaskContext";
import {
  Task,
  Quadrant,
  DueDateChange,
  TaskProgressUpdate,
} from "@/types/task";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs } from "@radix-ui/react-tabs";

const formSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    notes: z.string().optional(),
    icon: z.string().optional(),
    quadrant: z.number().int().min(1).max(5),
    dueDate: z.date().nullable(),
    lastDueDate: z.date().nullable(),
    dueDateReason: z.string().optional(),
    assignedToId: z.string().min(1, { message: "Please select an assignee" }),
    progress: z.number().int().min(0).max(100),
    progressUpdateNote: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.dueDate ||
      !data.lastDueDate ||
      data.dueDate.getTime() === data.lastDueDate.getTime()
        ? true
        : !!data.dueDateReason?.trim(),
    {
      message: "Reason required for changing due date",
      path: ["dueDateReason"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface EditTaskDialogProps {
  task: Task;
}

export function EditTaskDialog({ task }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dueDateChanged, setDueDateChanged] = useState(false);
  const [dueDateChangeReason, setDueDateChangeReason] = useState("");
  const [progressChanged, setProgressChanged] = useState(false);
  const [progressChangeUpdate, setProgressChangeUpdate] = useState("");
  const [lastDueDateChange, setLastDueDateChange] =
    useState<DueDateChange | null>(null);
  const [dueDateHistory, setDueDateHistory] = useState<DueDateChange[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] =
    useState<TaskProgressUpdate | null>(null);
  const [progressHistory, setProgressHistory] = useState<TaskProgressUpdate[]>(
    []
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isProgressSheetOpen, setIsProgressSheetOpen] = useState(false);

  const {
    updateTask,
    getVisibleUsers,
    fetchLatestDueDateChange,
    fetchDueDateChanges,
    fetchLatestProgressChange,
    fetchProgressChanges,
  } = useTaskContext();
  const { toast } = useToast();
  const visibleUsers = getVisibleUsers();

  // Fetch the latest due date change when the dialog opens
  useEffect(() => {
    if (open && task.id) {
      fetchLatestDueDateChange(task.id).then((change) => {
        setLastDueDateChange(change);
      });

      // Also fetch all history
      fetchDueDateChanges(task.id).then((history) => {
        setDueDateHistory(history);
      });
    }
  }, [open, task.id, fetchLatestDueDateChange, fetchDueDateChanges]);

  // Fetch progress history when component mounts
  useEffect(() => {
    if (open && task.id) {
      fetchLatestProgressChange(task.id).then((change) => {
        setLastProgressUpdate(change);
      });

      // Also fetch all history
      fetchProgressChanges(task.id).then((history) => {
        setProgressHistory(history);
      });
    }
  }, [open, task.id, fetchLatestProgressChange, fetchProgressChanges]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      notes: task.notes,
      icon: task.icon,
      quadrant: task.quadrant,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      assignedToId: task.assignedToId,
      progress: task.progress,
      lastDueDate: task.dueDate ? new Date(task.dueDate) : null,
      dueDateReason: dueDateChangeReason,
      progressUpdateNote: progressChangeUpdate,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const selectedUser = visibleUsers.find(
        (user) => user.id === values.assignedToId
      );

      if (!selectedUser) {
        toast({
          title: "Error",
          description: "Selected user not found",
          variant: "destructive",
        });
        return;
      }

      const hasDueDateChanged =
        values.dueDate &&
        task.dueDate &&
        new Date(values.dueDate).toISOString() !== task.dueDate;

      const hasProgressChanged =
        values.progress && task.progress && values.progress !== task.progress;

      console.log("Progress-----------------------", hasProgressChanged);
      await updateTask({
        ...task,
        title: values.title,
        notes: values.notes || "",
        icon: values.icon || "📋",
        quadrant: values.quadrant as Quadrant,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assignedToId: selectedUser.id,
        assignedToName: selectedUser.name,
        progress: values.progress,
        dueDateChangeReason: hasDueDateChanged
          ? dueDateChangeReason
          : undefined,
        progressUpdateNote: hasProgressChanged
          ? progressChangeUpdate
          : undefined,
      });

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const quadrantOptions = [
    { value: 1, label: "Urgent & Important" },
    { value: 2, label: "Important, Not Urgent" },
    { value: 3, label: "Urgent, Not Important" },
    { value: 4, label: "Neither Urgent nor Important" },
    { value: 5, label: "Routine Tasks" },
  ];

  const iconOptions = [
    "📋",
    "📱",
    "💻",
    "📊",
    "📝",
    "📬",
    "🔍",
    "⚡",
    "📞",
    "🔔",
    "📌",
    "🗓️",
    "🔧",
    "👨‍💻",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-6 w-6 mr-1">
          <Edit className="h-3 w-3" />
          <span className="sr-only">Edit Task</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-16 h-10 text-xl">
                          <SelectValue placeholder={field.value || "📋"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quadrant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadrant</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quadrant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quadrantOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem className="flex-col">
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team member" />
                          <Users className="h-4 w-4 ml-1 opacity-50" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {visibleUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => {
                  const handleDateSelect = (date: Date | undefined) => {
                    field.onChange(date);
                    const originalDueDate = task.dueDate
                      ? new Date(task.dueDate)
                      : null;
                    const selectedDate = date || null;

                    // Check if date has changed by comparing ISO strings or null values
                    const hasDateChanged =
                      (originalDueDate &&
                        selectedDate &&
                        originalDueDate.toISOString().split("T")[0] !==
                          selectedDate.toISOString().split("T")[0]) ||
                      (originalDueDate === null && selectedDate !== null) ||
                      (originalDueDate !== null && selectedDate === null);

                    if (hasDateChanged) {
                      setDueDateChanged(true);
                      setShowModal(true);
                    }
                  };

                  return (
                    <>
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>No due date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={handleDateSelect}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>

                      {/* Modal */}
                      <Dialog open={showModal} onOpenChange={setShowModal}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Reason for Changing Due Date
                            </DialogTitle>
                          </DialogHeader>

                          <FormItem>
                            <FormLabel>
                              Please provide a reason for changing the due date
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter reason..."
                                value={dueDateChangeReason}
                                onChange={(e) =>
                                  setDueDateChangeReason(e.target.value)
                                }
                              />
                            </FormControl>
                          </FormItem>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                // Reset due date to original
                                form.setValue(
                                  "dueDate",
                                  task.dueDate ? new Date(task.dueDate) : null
                                );
                                setShowModal(false);
                                setDueDateChanged(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                // Just close the modal, keeping the new date
                                form.setValue(
                                  "dueDateReason",
                                  dueDateChangeReason
                                );
                                setShowModal(false);
                              }}
                              disabled={!dueDateChangeReason.trim()}
                            >
                              Confirm
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="lastDueDate"
                render={() => (
                  <FormItem className="flex-col">
                    <FormLabel>Last Due Date</FormLabel>
                    <FormControl>
                      <>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div
                              className="cursor-pointer"
                              onClick={() => setIsSheetOpen(true)} // manually open sheet
                            >
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full pl-3 text-left font-normal flex justify-between items-center hover:bg-accent"
                              >
                                <div>
                                  {lastDueDateChange
                                    ? format(
                                        new Date(
                                          lastDueDateChange.last_due_date
                                        ),
                                        "MMM d, yyyy"
                                      )
                                    : task.dueDate
                                    ? format(
                                        new Date(task.dueDate),
                                        "MMM d, yyyy"
                                      )
                                    : "No previous date"}
                                </div>
                                <LucideFileText className="h-4 w-4 opacity-50" />
                              </Button>
                            </div>
                          </HoverCardTrigger>

                          <HoverCardContent
                            className="w-80 z-50"
                            align="start"
                            side="bottom"
                            onPointerDownOutside={(e) => e.preventDefault()}
                          >
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">
                                Last Change Details
                              </h4>
                              {lastDueDateChange ? (
                                <>
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      Changed on:
                                    </span>{" "}
                                    {format(
                                      new Date(lastDueDateChange.created_at),
                                      "PPP"
                                    )}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Reason:</span>{" "}
                                    {lastDueDateChange.reason_to_change ||
                                      "No reason provided"}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No change history available
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                          <SheetContent
                            side="right"
                            className="w-[400px] sm:w-[540px]"
                          >
                            <div className="p-4">
                              <h2 className="text-xl font-bold mb-4">
                                Detailed Due Date History
                              </h2>

                              {dueDateHistory.length === 0 ? (
                                <p className="text-muted-foreground">
                                  No due date history available.
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {dueDateHistory.map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="border rounded-lg p-4 shadow-sm"
                                    >
                                      <div className="text-sm text-muted-foreground mb-2">
                                        <strong>Changed on:</strong>{" "}
                                        {new Date(
                                          entry.created_at
                                        ).toLocaleString()}
                                      </div>
                                      <div className="text-sm">
                                        <strong>Last Due Date:</strong>{" "}
                                        {new Date(
                                          entry.last_due_date
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="text-sm">
                                        <strong>Updated Due Date:</strong>{" "}
                                        {new Date(
                                          entry.updated_due_date
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="text-sm">
                                        <strong>Reason:</strong>{" "}
                                        {entry.reason_to_change}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </SheetContent>
                        </Sheet>
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className=" flex justify-between">
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => {
                  const handleProgressChange = (values: number[]) => {
                    const newValue = values[0];
                    const currentValue = field.value || 0;

                    // Only allow progress to increase
                    if (newValue < currentValue) return;

                    if (newValue > currentValue) {
                      setPreviousProgress(currentValue);
                      field.onChange(newValue);
                      setShowProgressModal(true);
                    } else {
                      field.onChange(newValue);
                    }
                  };

                  return (
                    <>
                      <FormItem>
                        <FormLabel>Progress</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4 w-80">
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[field.value || 0]}
                              onValueChange={handleProgressChange}
                              className="flex-1"
                            />
                            <span className="w-12 text-right">
                              {field.value || 0}%
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>

                      {/* Progress Update Modal */}
                      <Dialog
                        open={showProgressModal}
                        onOpenChange={setShowProgressModal}
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Progress Update</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="What's been completed since last update?"
                              value={progressChangeUpdate}
                              onChange={(e) =>
                                setProgressChangeUpdate(e.target.value)
                              }
                              className="min-h-[120px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  // Reset due date to original
                                  form.setValue(
                                    "progress",
                                    task.progress ? task.progress : null
                                  );
                                  setShowProgressModal(false);
                                  setProgressChanged(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={() => {
                                  // Just close the modal, keeping the new date
                                  form.setValue(
                                    "progressUpdateNote",
                                    progressChangeUpdate
                                  );
                                  setShowProgressModal(false);
                                  setProgressChanged(true);
                                }}
                                disabled={!progressChangeUpdate.trim()}
                              >
                                Confirm
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="progressUpdateNote"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div
                            className="cursor-pointer"
                            onClick={() => setIsProgressSheetOpen(true)} // manually open sheet
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="p-3 mt-3 text-left font-normal hover:bg-accent"
                            >
                              <LucideFileText className="h-4 w-4 opacity-50" />
                            </Button>
                          </div>
                        </HoverCardTrigger>

                        <HoverCardContent
                          className="w-80 z-50"
                          align="start"
                          side="bottom"
                        >
                          {lastProgressUpdate ? (
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">Updated:</span>{" "}
                                {format(
                                  new Date(lastProgressUpdate.created_at),
                                  "PPP"
                                )}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">
                                  Progress change:
                                </span>{" "}
                                {lastProgressUpdate.previous_progress}% →{" "}
                                {lastProgressUpdate.current_progress}%
                              </div>
                              {lastProgressUpdate.updates && (
                                <div className="text-sm flex gap-2">
                                  <span className="font-medium">Notes:</span>
                                  {lastProgressUpdate.updates}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No update history available
                            </div>
                          )}
                        </HoverCardContent>
                      </HoverCard>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Sheet
                open={isProgressSheetOpen}
                onOpenChange={setIsProgressSheetOpen}
              >
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <div className="p-4">
                    {progressHistory.length === 0 ? (
                      <p className="text-muted-foreground mt-6">
                        No progress history available.
                      </p>
                    ) : (
                      <div className="mt-6">
                        <h2 className="text-xl font-bold mb-4">
                          Progress Update History
                        </h2>
                        <div className="space-y-4">
                          {progressHistory.map((entry) => (
                            <div
                              key={entry.id}
                              className="border rounded-lg p-4 shadow-sm"
                            >
                              <div className="text-sm text-muted-foreground mb-2">
                                <strong>Updated on:</strong>{" "}
                                {new Date(entry.created_at).toLocaleString()}
                              </div>
                              <div className="text-sm">
                                <strong>Previous Progress:</strong>{" "}
                                {entry.previous_progress}%
                              </div>
                              <div className="text-sm">
                                <strong>Current Progress:</strong>{" "}
                                {entry.current_progress}%
                              </div>
                              <div className="text-sm">
                                <strong>Work Done:</strong> {entry.updates}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={dueDateChanged && !dueDateChangeReason.trim()}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
