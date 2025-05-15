
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Report } from "@/types/report";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import TaskItem from "@/components/report/TaskItem";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/contexts/ReportContext";

interface ReportModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal = ({ report, isOpen, onClose }: ReportModalProps) => {
  const navigate = useNavigate();
  const { deleteReport } = useReports();

  if (!report) {
    return null;
  }

  const handleEdit = () => {
    onClose();
    navigate("/report");
  };

  const handleDelete = () => {
    deleteReport(report.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Daily Report: {format(report.date, "MMMM d, yyyy")}
          </DialogTitle>
          <div className="flex gap-2 mt-2">
            {report.isOnLeave && <Badge className="bg-leave">On Leave</Badge>}
            {report.isHalfDay && <Badge className="bg-halfday text-black">Half Day</Badge>}
            {!report.isOnLeave && !report.isHalfDay && (
              <Badge className="bg-completed">Full Day</Badge>
            )}
          </div>
        </DialogHeader>

        {!report.isOnLeave && report.tasks.length > 0 && (
          <div className="my-4">
            <h3 className="text-lg font-semibold mb-4">Tasks</h3>
            <div className="space-y-4">
              {report.tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onChange={() => {}}
                  onDelete={() => {}}
                  disabled={true}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-1"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
