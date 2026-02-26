import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CalendarClock, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Job } from "@/app/dashboard/page"; 

interface DashboardMetricsProps {
  jobs: Job[];
}

export function DashboardMetrics({ jobs }: DashboardMetricsProps) {
  // Calculate metrics on the fly
  const todayStr = new Date().toISOString().split("T")[0];
  
  const totalActiveJobs = jobs.length;
  const dueTodayCount = jobs.filter(job => job.deliveryDate === todayStr).length;
  const totalPendingAmount = jobs.reduce((sum, job) => sum + (Number(job.amount) || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="bg-blue-50 border-blue-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">Total Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{totalActiveJobs}</div>
          <p className="text-xs text-blue-600 mt-1">Jobs currently in processing</p>
        </CardContent>
      </Card>

      <Card className="bg-red-50 border-red-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Due Today</CardTitle>
          <CalendarClock className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{dueTodayCount}</div>
          <p className="text-xs text-red-600 mt-1">Jobs scheduled for {todayStr}</p>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Pending Value</CardTitle>
          <Banknote className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">AED {formatCurrency(totalPendingAmount)}</div>
          <p className="text-xs text-green-600 mt-1">Value of all active jobs</p>
        </CardContent>
      </Card>
    </div>
  );
}