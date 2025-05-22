import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types/user";
import { useToast } from "@/components/ui/use-toast";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/utils/permissionUtils";

interface ChangeManagerDialogProps {
  user: User;
  onManagerChanged: () => void;
}

export function ChangeManagerDialog({
  user,
  onManagerChanged,
}: ChangeManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [superManagers, setSuperManagers] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    user.managerId || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Get permissions based on current user role
  const currentUserRole = profile?.role || "employee";
  const isUserUnderManager = profile?.id === user.managerId;
  const permissions = getUserPermissions(
    currentUserRole,
    user.id,
    profile?.id,
    isUserUnderManager
  );

useEffect(() => {
  if (open) {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (user.role === "manager") {
          const superManagers = await userService.getUsersByRole("super-manager");
          setSuperManagers(superManagers);
          setSelectedManagerId(user.managerId || superManagers[0]?.id || "");
        } else {
          const managers = await userService.getUsersByRole("manager");
          setManagers(managers);
          setSelectedManagerId(user.managerId || managers[0]?.id || "");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load managers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }
}, [open]);

  const handleUpdateManager = async () => {
    if (!selectedManagerId) {
      toast({
        title: "Error",
        description: "Please select a manager.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await userService.updateUserManager(user.id, selectedManagerId);

      toast({
        title: "Manager updated",
        description: `Manager has been updated successfully for ${user.name}.`,
      });

      setOpen(false);
      onManagerChanged();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update manager.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user has permission to change managers
  if (!permissions.canAssignTeamLeads && currentUserRole !== "admin") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
<DialogTrigger asChild>
  <Button variant="outline" size="sm" disabled={!permissions.canAssignTeamLeads && currentUserRole !== "admin"}>
    Change Manager
  </Button>
</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Manager</DialogTitle>
          <DialogDescription>
            Select a new manager for {user.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Select
              value={selectedManagerId}
              onValueChange={setSelectedManagerId}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
               <>
  <SelectItem value="no-manager">No manager</SelectItem>

  {user.role === "manager" ? (
    superManagers.length === 0 ? (
      <SelectItem value="no-super-managers" disabled>
        No available super managers
      </SelectItem>
    ) : (
      superManagers.map((sm) => (
        <SelectItem key={sm.id} value={sm.id}>
          {sm.name}
        </SelectItem>
      ))
    )
  ) : user.role === "team-lead" || user.role === "employee" ? (
    managers.length === 0 ? (
      <SelectItem value="no-managers-available" disabled>
        No available managers
      </SelectItem>
    ) : (
      managers.map((manager) => (
        <SelectItem key={manager.id} value={manager.id}>
          {manager.name}
        </SelectItem>
      ))
    )
  ) : null}
</>


                {/* {managers.length === 0 ? (
                  <SelectItem value="no-managers" disabled>No managers available</SelectItem>
                ) : (
                  managers.map(manager => (
                    <SelectItem 
                      key={manager.id} 
                      value={manager.id}
                      // Disable selecting the same manager
                      disabled={user.managerId === manager.id}
                    >
                      {manager.name}
                    </SelectItem>
                  ))
                )} */}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpdateManager}
            disabled={
  isLoading ||
  (!selectedManagerId && selectedManagerId !== "") ||
  user.managerId === selectedManagerId
}

          >
            {isLoading ? "Updating..." : "Update Manager"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
