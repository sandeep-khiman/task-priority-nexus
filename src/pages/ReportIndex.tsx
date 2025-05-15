import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Calendar } from "lucide-react";
import { Header } from "@/components/Header";

const ReportIndex = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            Daily Reporting Application
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Track your daily work, manage tasks, and visualize your productivity
            through an interactive calendar dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/report">
                <FileText className="h-5 w-5" />
                Submit Daily Report
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/dashboard">
                <Calendar className="h-5 w-5" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportIndex;
