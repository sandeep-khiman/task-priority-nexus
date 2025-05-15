import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReports } from "@/contexts/ReportContext";
import { Report, ReportStatus } from "@/types/report";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import ReportModal from "@/components/dashboard/ReportModal";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

const ReportDashboard = () => {
  const navigate = useNavigate();
  const { reports } = useReports();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const nextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const goToToday = () => setCurrentMonth(new Date());

  const getReportForDay = (date: Date) =>
    reports.find((report) => isSameDay(new Date(report.date), date));

  const getStatusForDay = (date: Date): ReportStatus => {
    const report = getReportForDay(date);
    if (!report) return "none";
    if (report.isOnLeave) return "on-leave";
    if (report.isHalfDay) return "half-day";
    return "completed";
  };

  const getClassForStatus = (status: ReportStatus) => {
    switch (status) {
      case "on-leave":
        return "bg-leave/10 border-leave text-leave";
      case "half-day":
        return "bg-halfday/10 border-halfday text-halfday";
      case "completed":
        return "bg-completed/10 border-completed text-completed";
      default:
        return "bg-white border-gray-200";
    }
  };

  const handleDayClick = (date: Date) => {
    const report = getReportForDay(date);
    report ? setSelectedReport(report) || setIsModalOpen(true) : navigate("/report");
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="w-[90%] mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Report Dashboard</h1>
          </div>
          <Button asChild className="shadow-md">
            <Link to="/report" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> New Report
            </Link>
          </Button>
        </div>

        <Card className="shadow-lg mb-6 border-none">
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 text-muted-foreground">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-24" />
              ))}

              {daysInMonth.map((day) => {
                const status = getStatusForDay(day);
                const dayReport = getReportForDay(day);

                return (
                  <TooltipProvider key={day.toString()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleDayClick(day)}
                          className={cn(
                            "border rounded-lg aspect-square p-2 flex flex-col justify-between items-start shadow-sm hover:shadow-md transition-all duration-200",
                            getClassForStatus(status),
                            isToday(day) && "ring-2 ring-primary",
                            !isSameMonth(day, currentMonth) && "opacity-50"
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm self-end",
                              isToday(day) && "font-bold text-primary"
                            )}
                          >
                            {format(day, "d")}
                          </span>

                          {status !== "none" && (
                            <div className="w-full">
                              <span
                                className={cn(
                                  "text-xs font-medium rounded-full px-2 py-1 block text-center mt-auto",
                                  status === "on-leave"
                                    ? "bg-leave text-white"
                                    : status === "half-day"
                                    ? "bg-halfday text-black"
                                    : "bg-completed text-white"
                                )}
                              >
                                {status === "on-leave"
                                  ? "Leave"
                                  : status === "half-day"
                                  ? "Half Day"
                                  : `${dayReport?.tasks.length || 0} Task${
                                      dayReport?.tasks.length !== 1 ? "s" : ""
                                    }`}
                              </span>
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>

                      <TooltipContent side="top">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">{format(day, "MMMM d, yyyy")}</div>
                          {dayReport ? (
                            <>
                              <div>
                                {dayReport.isOnLeave
                                  ? "On Leave"
                                  : dayReport.isHalfDay
                                  ? "Half Day"
                                  : `${dayReport.tasks.length} Task${
                                      dayReport.tasks.length !== 1 ? "s" : ""
                                    }`}
                              </div>
                              {!dayReport.isOnLeave && (
                                <div>
                                  {
                                    dayReport.tasks.filter(
                                      (t) => t.status === "Completed"
                                    ).length
                                  }{" "}
                                  completed
                                </div>
                              )}
                            </>
                          ) : (
                            <div>No report</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}

              {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                <div key={`empty-end-${index}`} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-leave" />
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-halfday" />
            <span>Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-completed" />
            <span>Report Submitted</span>
          </div>
        </div>

        <ReportModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </main>
    </div>
  );
};

export default ReportDashboard;
