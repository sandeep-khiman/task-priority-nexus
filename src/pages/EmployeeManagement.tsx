import { useState } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useReports } from "@/contexts/ReportContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";

// Mock data for employees with roles instead of positions
const employees = [
  { id: "1", name: "John Doe", role: "Team Lead" },
  { id: "2", name: "Jane Smith", role: "Employee" },
  { id: "3", name: "Mike Johnson", role: "Employee" },
  { id: "4", name: "Sarah Williams", role: "Manager" },
  { id: "5", name: "Alex Brown", role: "Employee" },
];

// Mock data for today's reports
const todaysReports = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "John Doe",
    title: "Frontend Sprint Progress",
    timestamp: new Date().setHours(9, 15),
    content:
      "Completed the implementation of the new login page. Started work on the dashboard components. Will need another day to finish the responsive design aspects.",
    tasks: [
      {
        description: "Login page implementation",
        status: "Completed",
        completion: 100,
      },
      {
        description: "Dashboard components",
        status: "In Progress",
        completion: 60,
      },
    ],
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Jane Smith",
    title: "UX Design Updates",
    timestamp: new Date().setHours(10, 30),
    content:
      "Finalized the wireframes for the user profile section. Got feedback from the team and made necessary adjustments. Will begin working on the high-fidelity mockups tomorrow.",
    tasks: [
      {
        description: "User profile wireframes",
        status: "Completed",
        completion: 100,
      },
      {
        description: "High-fidelity mockups",
        status: "Pending",
        completion: 0,
      },
    ],
  },
  {
    id: "3",
    employeeId: "5",
    employeeName: "Alex Brown",
    title: "Testing Results",
    timestamp: new Date().setHours(14, 45),
    content:
      "Completed the test cases for the authentication flow. Found 3 critical bugs that need to be addressed before release. Will provide more detailed documentation tomorrow.",
    tasks: [
      {
        description: "Authentication test cases",
        status: "Completed",
        completion: 100,
      },
      {
        description: "Bug documentation",
        status: "In Progress",
        completion: 80,
      },
    ],
  },
];

const EmployeeManagement = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { reports } = useReports();
  const navigate = useNavigate();

  const handleEmployeeClick = (employee: { id: string; name: string }) => {
    setSelectedEmployee(employee);
    setIsCalendarOpen(true);
  };

  const handleViewReport = (employeeId: string, date: Date) => {
    // Close the calendar dialog
    setIsCalendarOpen(false);

    // Navigate to the dashboard with the employee's information
    navigate(
      `/dashboard?employeeId=${employeeId}&date=${format(date, "yyyy-MM-dd")}`
    );
  };

  // Filter reports for selected employee and date
  const getEmployeeReportForDate = (employeeId: string, date: Date) => {
    return reports.find(
      (report) =>
        report.user_id === employeeId &&
        format(new Date(report.date), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd")
    );
  };

  // Get attendance status for the selected date
  const getAttendanceStatus = (employeeId: string, date: Date) => {
    const report = getEmployeeReportForDate(employeeId, date);
    if (!report) return "Absent";
    if (report.is_on_leave) return "On Leave";
    if (report.is_half_day) return "Half Day";
    return "Present";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="container py-6 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Employee Management</h1>
            </div>

            <Tabs defaultValue="employees" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#7C8EA4]  text-white">
                <TabsTrigger value="employees">Employee List</TabsTrigger>
                <TabsTrigger value="today">Today's Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="employees">
                <Card>
                  <CardHeader>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>
                      Click on an employee to view their calendar and reports.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>{employee.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  employee.role === "Manager"
                                    ? "default"
                                    : employee.role === "Team Lead"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {employee.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                onClick={() => handleEmployeeClick(employee)}
                              >
                                View Calendar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="today">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Reports</CardTitle>
                    <CardDescription>
                      Reports submitted today:{" "}
                      {format(new Date(), "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {todaysReports.length > 0 ? (
                      <div className="space-y-6">
                        {todaysReports.map((report) => (
                          <Card
                            key={report.id}
                            className="border border-gray-200"
                          >
                            <CardHeader className="bg-gray-50 pb-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg">
                                    {report.title}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-2">
                                    <span>{report.employeeName}</span>
                                    <span>•</span>
                                    <span>
                                      {format(
                                        new Date(report.timestamp),
                                        "h:mm a"
                                      )}
                                    </span>
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-gray-700">
                                    {report.content}
                                  </p>
                                </div>

                                <div className="mt-4">
                                  <h4 className="font-medium text-sm mb-2">
                                    Tasks:
                                  </h4>
                                  <div className="space-y-2">
                                    {report.tasks.map((task, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between text-sm border-b pb-2"
                                      >
                                        <div className="flex-1">
                                          {task.description}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 rounded-full text-xs ${
                                              task.status === "Completed"
                                                ? "bg-green-100 text-green-800"
                                                : task.status === "In Progress"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                          >
                                            {task.status}
                                          </span>
                                          <span className="text-gray-500">
                                            {task.completion}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No reports submitted today
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Employee Calendar Dialog */}
            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{selectedEmployee?.name}'s Calendar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />

                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium">Attendance Status:</h3>
                    <p>
                      {selectedEmployee &&
                        getAttendanceStatus(selectedEmployee.id, selectedDate)}
                    </p>

                    <div className="mt-4">
                      <Button
                        className="w-full"
                        onClick={() =>
                          selectedEmployee &&
                          handleViewReport(selectedEmployee.id, selectedDate)
                        }
                      >
                        View Report Details
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
