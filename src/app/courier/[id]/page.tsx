// src/app/courier/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Box, CheckCircle, Loader2, Truck, SplitSquareHorizontal } from "lucide-react"; 

interface Job {
  id?: string;
  client: string;
  jobName: string;
  location: string;
  invoiceNo: string;
  amount: number;
  paymentInfo: string;
  status: string;
  jobQty?: number;     
  packageQty?: number; 
  [key: string]: string | number | boolean | Date | undefined;
}

const COURIERS = ["FedEx", "DHL"];

export default function CourierServicePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [job, setJob] = useState<Job | null>(null);
  
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [remainingJobQty, setRemainingJobQty] = useState<number | "">("");
  const [remainingPackageQty, setRemainingPackageQty] = useState<number | "">("");

  const [partialJobQty, setPartialJobQty] = useState<number | "">("");
  const [partialPackageQty, setPartialPackageQty] = useState<number | "">("");

  const [showFullDialog, setShowFullDialog] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if(id) {
        getDoc(doc(db, "jobs", id as string)).then(snap => {
            if(snap.exists()) {
                const data = snap.data() as Job;
                setJob({ id: snap.id, ...data });
                setRemainingJobQty(data.jobQty || "");
                setRemainingPackageQty(data.packageQty || "");
            }
        });
    }
  }, [id]);

  const getDriverString = () => {
    const trimmedTracking = trackingNumber.trim();
    return trimmedTracking ? `${courier} - ${trimmedTracking}` : courier;
  };

  // --- 1. FULL DELIVERY ACTION ---
  const handleFullDelivery = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!id || !job) return;
    if (!courier) {
        toast.error("Please select a Courier (FedEx or DHL).");
        return;
    }

    setIsProcessing(true); 

    try {
      await updateDoc(doc(db, "jobs", id as string), {
        status: "Completed",
        completedAt: serverTimestamp(),
        driver: "",
        deliveryType: getDriverString(),
        jobQty: Number(remainingJobQty) || 0,
        packageQty: Number(remainingPackageQty) || 0
      });
      
      toast.success("Job Completed via Courier");
      router.push("/dashboard"); 
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to process full delivery");
      setIsProcessing(false);
    }
  };

  // --- 2. PARTIAL DELIVERY ACTION ---
  const handlePartialDelivery = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!id || !job) return;

    if (!courier) {
        toast.error("Please select a Courier.");
        return;
    }
    if (!partialJobQty || !partialPackageQty) {
        toast.error("Please enter the Job Qty and Package Qty being shipped.");
        return;
    }

    if (Number(partialJobQty) > Number(remainingJobQty)) {
        toast.error("Cannot ship more items than the current inventory.");
        return;
    }
    if (Number(partialPackageQty) > Number(remainingPackageQty)) {
        toast.error("Cannot ship more boxes than the current inventory.");
        return;
    }

    setIsProcessing(true);

    try {
      // Calculate what will be left over
      const updatedRemainingJobQty = Math.max(0, Number(remainingJobQty) - Number(partialJobQty));
      const updatedRemainingPackageQty = Math.max(0, Number(remainingPackageQty) - Number(partialPackageQty));

      // --- THE FIX: Check if they just emptied the inventory ---
      const isDepleted = updatedRemainingJobQty === 0 && updatedRemainingPackageQty === 0;

      if (isDepleted) {
        // If 0 remaining, treat it as a Full Delivery to clean up the dashboard
        await updateDoc(doc(db, "jobs", id as string), {
          status: "Completed",
          completedAt: serverTimestamp(),
          driver: "",
          deliveryType: getDriverString(),
          jobQty: Number(partialJobQty),
          packageQty: Number(partialPackageQty),
          jobName: `${job.jobName} (Final Delivery)` // Note it was the last batch
        });

        toast.success("All remaining items shipped! Job moved to History.");
      } else {
        // Otherwise, do the standard Partial Delivery (Clone + Subtract)
        const { id: jobId, ...jobDataWithoutId } = job; 
        
        const clonedJob = {
          ...jobDataWithoutId,
          status: "Completed",
          completedAt: serverTimestamp(),
          driver: "",
          deliveryType: getDriverString(),
          jobQty: Number(partialJobQty),
          packageQty: Number(partialPackageQty),
          jobName: `${job.jobName} (Partial Delivery)`
        };

        await addDoc(collection(db, "jobs"), clonedJob);

        await updateDoc(doc(db, "jobs", id as string), {
          jobQty: updatedRemainingJobQty,
          packageQty: updatedRemainingPackageQty,
          paymentInfo: "Partial Delivery" 
        });

        toast.success("Partial Delivery recorded! Remaining items kept in Active Jobs.");
      }

      router.push("/dashboard");

    } catch (error) {
       console.error(error);
       toast.error("Failed to process partial delivery");
       setIsProcessing(false);
    }
  };

  if (!job) return <div className="p-10 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading Job...</div>;

  const isJobQtyExceeded = Number(partialJobQty) > Number(remainingJobQty);
  const isPackageQtyExceeded = Number(partialPackageQty) > Number(remainingPackageQty);
  const isPartialInvalid = isJobQtyExceeded || isPackageQtyExceeded || !partialJobQty || !partialPackageQty;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost"><ArrowLeft /></Button></Link>
            <div>
              <h1 className="text-3xl font-bold">Courier Service</h1>
              <p className="text-gray-500">Job: {job.client} - {job.jobName}</p>
            </div>
        </div>
      </div>

      {/* 1. COURIER DETAILS CARD */}
      <Card className="border-t-4 border-t-blue-600 shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Shipping Details
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Select Courier <span className="text-red-500">*</span></Label>
                <Select value={courier} onValueChange={setCourier}>
                  <SelectTrigger><SelectValue placeholder="e.g. FedEx" /></SelectTrigger>
                  <SelectContent>
                      {COURIERS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
                <Label>Tracking Number / AWB</Label>
                <Input 
                   placeholder="Enter tracking number"
                   value={trackingNumber} 
                   onChange={(e) => setTrackingNumber(e.target.value)} 
                />
            </div>
        </CardContent>
      </Card>

      {/* 2. REMAINING QUANTITIES CARD (Editable by user) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-gray-700" />
                Total Job Quantity Information
            </CardTitle>
            <p className="text-sm text-gray-500">Update these totals if they are incorrect before processing a delivery.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <Label>Current Job Qty (Items)</Label>
                <Input 
                   type="number"
                   min={0}
                   value={remainingJobQty} 
                   onChange={(e) => setRemainingJobQty(Number(e.target.value) || "")} 
                />
            </div>
            <div className="space-y-2">
                <Label>Current Package Qty (Boxes)</Label>
                <Input 
                   type="number"
                   min={0}
                   value={remainingPackageQty} 
                   onChange={(e) => setRemainingPackageQty(Number(e.target.value) || "")} 
                />
            </div>
        </CardContent>
      </Card>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button 
            variant="outline"
            className="flex-1 py-8 text-lg border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            onClick={() => {
                if(!courier) return toast.error("Please select a Courier first");
                setShowPartialDialog(true);
            }}
          >
              <SplitSquareHorizontal className="mr-3 h-6 w-6" />
              Process Partial Delivery
          </Button>

          <Button 
            className="flex-1 py-8 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => {
                if(!courier) return toast.error("Please select a Courier first");
                setShowFullDialog(true);
            }}
          >
              <CheckCircle className="mr-3 h-6 w-6" />
              Process Full Delivery
          </Button>
      </div>

      {/* --- DIALOG 1: FULL DELIVERY --- */}
      <AlertDialog open={showFullDialog} onOpenChange={setShowFullDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Full Delivery</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the entire job as Completed and move it to your History Log.
              <br/><br/>
              <strong>Courier:</strong> {getDriverString()}<br/>
              <strong>Final Job Qty:</strong> {remainingJobQty || 0}<br/>
              <strong>Final Boxes:</strong> {remainingPackageQty || 0}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleFullDelivery} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
            >
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Confirm Full Delivery"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DIALOG 2: PARTIAL DELIVERY --- */}
      <AlertDialog open={showPartialDialog} onOpenChange={setShowPartialDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
                <SplitSquareHorizontal className="h-5 w-5" />
                Process Partial Delivery
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter the quantities you are handing over to the courier <strong>right now</strong>. 
              The remaining balance will stay on your Active Dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                  <Label>Job Qty Shipping Now</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={Number(remainingJobQty) || undefined}
                    placeholder={`Max: ${remainingJobQty}`}
                    value={partialJobQty} 
                    onChange={e => setPartialJobQty(Number(e.target.value) || "")} 
                    className={isJobQtyExceeded ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {isJobQtyExceeded && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      Cannot exceed current inventory ({remainingJobQty})
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                  <Label>Package Qty Shipping Now</Label>
                  <Input 
                    type="number" 
                    min={1}
                    max={Number(remainingPackageQty) || undefined} 
                    placeholder={`Max: ${remainingPackageQty}`}
                    value={partialPackageQty} 
                    onChange={e => setPartialPackageQty(Number(e.target.value) || "")} 
                    className={isPackageQtyExceeded ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {isPackageQtyExceeded && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      Cannot exceed current inventory ({remainingPackageQty})
                    </p>
                  )}
              </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handlePartialDelivery} 
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                disabled={isProcessing || isPartialInvalid}
            >
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Confirm Partial Ship"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}