import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CalendarClock, Banknote, AlertTriangle } from "lucide-react"; // Added AlertTriangle
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
  // NEW: Any job with a date strictly less than today is delayed
  const delayedCount = jobs.filter(job => job.deliveryDate < todayStr).length;
  const totalPendingAmount = jobs.reduce((sum, job) => sum + (Number(job.amount) || 0), 0);

  return (
    // Updated to grid-cols-4
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      
      {/* 1. ACTIVE JOBS */}
      <Card className="bg-blue-50 border-blue-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">Total Active</CardTitle>
          <Briefcase className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{totalActiveJobs}</div>
          <p className="text-xs text-blue-600 mt-1">Jobs currently processing</p>
        </CardContent>
      </Card>

      {/* 2. DUE TODAY (Amber/Yellow theme) */}
      <Card className="bg-amber-50 border-amber-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-amber-800">Due Today</CardTitle>
          <CalendarClock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-900">{dueTodayCount}</div>
          <p className="text-xs text-amber-600 mt-1">Scheduled for {todayStr}</p>
        </CardContent>
      </Card>

      {/* 3. DELAYED (Red theme) */}
      <Card className="bg-red-50 border-red-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Delayed</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{delayedCount}</div>
          <p className="text-xs text-red-600 mt-1">Past delivery date</p>
        </CardContent>
      </Card>

      {/* 4. PENDING VALUE */}
      <Card className="bg-green-50 border-green-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Pending Value</CardTitle>
          <Banknote className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">AED {formatCurrency(totalPendingAmount)}</div>
          <p className="text-xs text-green-600 mt-1">Value of active jobs</p>
        </CardContent>
      </Card>
      
    </div>
  );
}