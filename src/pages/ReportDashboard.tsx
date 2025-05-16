
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReports } from "@/contexts/ReportContext";
import { Report, ReportStatus } from "@/types/report";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ReportModal from "@/components/dashboard/ReportModal";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

const ReportDashboard = () => {
  const navigate = useNavigate();
  const { reports } = useReports();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get days for the current month
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

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getReportForDay = (date: Date) => {
    return reports.find(report => isSameDay(new Date(report.date), date));
  };

  const getStatusForDay = (date: Date): ReportStatus => {
    const report = getReportForDay(date);
    if (!report) return "none";
    if (report.is_on_leave) return "on-leave";
    if (report.is_half_day) return "half-day";
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
    setSelectedDate(date);
    setSelectedReport(report || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
                      <Header />
                      <div className="flex-1">
                        <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Report Dashboard</h1>
        </div>
        <Button 
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedReport(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> New Report
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium text-sm py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-start-${index}`} className="border rounded-md h-24" />
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
                          "border rounded-md h-24 p-2 flex flex-col hover:shadow-md transition-all",
                          getClassForStatus(status),
                          isToday(day) && "ring-2 ring-primary",
                          !isSameMonth(day, currentMonth) && "opacity-50"
                        )}
                      >
                        <div className={cn(
                          "text-right text-sm mb-1",
                          isToday(day) && "font-bold text-primary"
                        )}>
                          {format(day, "d")}
                        </div>
                        {status !== "none" && (
                          <div className="mt-auto">
                            <div className={cn(
                              "text-xs rounded-full px-2 py-1 text-center",
                              status === "on-leave" ? "bg-leave text-white" :
                              status === "half-day" ? "bg-halfday text-black" :
                              "bg-completed text-white"
                            )}>
                              {status === "on-leave" ? "Leave" : 
                               status === "half-day" ? "Half Day" : 
                               `${dayReport?.tasks.length || 0} Task${dayReport?.tasks.length !== 1 ? 's' : ''}`}
                            </div>
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-bold">{format(day, "MMMM d, yyyy")}</div>
                        {dayReport ? (
                          <>
                            <div>
                              {dayReport.is_on_leave 
                                ? "On Leave" 
                                : dayReport.is_half_day 
                                ? "Half Day" 
                                : `${dayReport.tasks.length} Task${dayReport.tasks.length !== 1 ? 's' : ''}`}
                            </div>
                            {!dayReport.is_on_leave && (
                              <div>
                                {dayReport.tasks.filter(t => t.status === "Completed").length} completed
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
              <div key={`empty-end-${index}`} className="border rounded-md h-24" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-leave"></div>
          <span className="text-sm">On Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-halfday"></div>
          <span className="text-sm">Half Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-completed"></div>
          <span className="text-sm">Report Submitted</span>
        </div>
      </div>

      <ReportModal
        report={selectedReport}
        selectedDate={selectedDate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
    </div>
    </div>
  );
};

export default ReportDashboard;
