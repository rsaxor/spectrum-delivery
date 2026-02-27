"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useReactToPrint } from "react-to-print";
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
import { Printer, ArrowLeft, Box, FileText, CheckCircle, Loader2 } from "lucide-react"; 

// --- NEW IMPORTS ---
import { Job, Package, PrintData } from "@/types/job";
import { LabelTemplate } from "@/components/print/LabelTemplate";
import { MasterDeliveryNote } from "@/components/print/MasterDeliveryNote";
import { DRIVERS } from "@/lib/constants";
import { AllLabelsTemplate } from "@/components/print/AllLabelsTemplate";

export default function PrintPackagePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [job, setJob] = useState<Job | null>(null);
  const [driver, setDriver] = useState("");
  const [totalBoxes, setTotalBoxes] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState("");
  
  // Dialog & Loading States
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [packages, setPackages] = useState<Package[]>([
    // { id: 1, size: "A4", itemNo: "", desc: "", qty: "", remarks: "" }
    { id: 1, size: "A5", desc: "", qty: "" }
  ]);

  const handleBoxCountChange = (count: number) => {
    setTotalBoxes(count);
    const newPackages = Array.from({ length: count }).map((_, i) => {
      //  return packages[i] || { id: i + 1, size: "A4", itemNo: "", desc: "", qty: "", remarks: "" };
      return packages[i] || { id: i + 1, size: "A5", desc: "", qty: "" };
    });
    setPackages(newPackages);
  };

  const handleTotalQuantityChange = (newTotal: string) => {
    setTotalQuantity(newTotal);
    
    const resetPackages = packages.map(pkg => ({ ...pkg, qty: "" }));
    setPackages(resetPackages);
  };
  
  const handleQtyChange = (index: number, value: string) => {
    // If totalQuantity is empty, just let them type whatever
    if (!totalQuantity) {
      updatePackage(index, "qty", value);
      return;
    }

    // Extract numbers from strings (e.g. "500 pcs" -> 500)
    const totalNum = parseInt(totalQuantity.replace(/\D/g, "")) || 0;
    const inputNum = parseInt(value.replace(/\D/g, "")) || 0;

    // Check if the current input alone exceeds the total
    if (inputNum > totalNum) {
      toast.error("Quantity Limit Exceeded", {
        description: `This package quantity (${inputNum}) cannot be greater than the Total Job Quantity (${totalNum}).`
      });
      // Optionally reset the field or just cap it
      updatePackage(index, "qty", totalNum.toString()); 
      return;
    }

    // Advanced Check: Calculate the sum of ALL packages to make sure they don't exceed the total together
    let sumOfOtherPackages = 0;
    packages.forEach((pkg, i) => {
        if (i !== index) {
            sumOfOtherPackages += parseInt(pkg.qty.replace(/\D/g, "")) || 0;
        }
    });

    if ((sumOfOtherPackages + inputNum) > totalNum) {
        toast.error("Total Quantity Exceeded", {
            description: `The combined package quantities exceed the Total Job Quantity (${totalNum}).`
        });
        
        // Cap the input to whatever is remaining
        const remainingAllowed = totalNum - sumOfOtherPackages;
        updatePackage(index, "qty", remainingAllowed > 0 ? remainingAllowed.toString() : "0");
        return;
    }

    // If it passes validation, update the state normally
    updatePackage(index, "qty", value);
  };

  const updatePackage = (index: number, field: keyof Package, value: string) => {
    const newPkgs = [...packages];
    newPkgs[index] = { ...newPkgs[index], [field]: value };
    setPackages(newPkgs);
  };

  useEffect(() => {
    if(id) {
        getDoc(doc(db, "jobs", id as string)).then(snap => {
            if(snap.exists()) setJob(snap.data() as Job);
        });
    }
  }, [id]);

  const handleMarkComplete = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!id) return;

    if (!driver) {
        toast.error("Please select a Driver before completing.");
        return;
    }

    setIsCompleting(true); 

    try {
      await updateDoc(doc(db, "jobs", id as string), {
        status: "Completed",
        completedAt: serverTimestamp(),
        driver: driver,
        deliveryType: "Spectrum Delivery"
      });
      
      toast.success("Job Completed", { description: "Redirecting to dashboard..." });
      router.push("/dashboard"); 
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
      setIsCompleting(false);
    }
  };

  // --- PRINTING LOGIC ---
  const labelRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const handleLabelPrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: "Package Label",
  });

  const triggerLabelPrint = (pkg: Package) => {
    setPrintData({ ...pkg, job: job!, driver, totalBoxes, totalQuantity });
    setTimeout(() => {
      handleLabelPrint();
    }, 100);
  };

  const masterRef = useRef<HTMLDivElement>(null);
  const handleMasterPrint = useReactToPrint({
    contentRef: masterRef,
    documentTitle: `Delivery_Note_${job?.invoiceNo || "Master"}`,
  });

  const allLabelsRef = useRef<HTMLDivElement>(null);
  const handlePrintAllLabels = useReactToPrint({
    contentRef: allLabelsRef,
    documentTitle: `All_Labels_${job?.invoiceNo}`,
  });

  if (!job) return <div className="p-10 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading Job...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost"><ArrowLeft /></Button></Link>
            <div>
            <h1 className="text-3xl font-bold">Package & Print</h1>
            <p className="text-gray-500">Job: {job.client} - {job.jobName}</p>
            </div>
        </div>

        <div className="flex gap-2">
            <Button 
                onClick={() => handleMasterPrint()} 
                className="bg-slate-900 text-white hover:bg-slate-800"
            >
                <FileText className="mr-2 h-4 w-4" />
                Print Master Delivery
            </Button>
            {packages.length > 1 && (
              <Button 
                onClick={() => handlePrintAllLabels()} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print All Labels
              </Button>
            )}
            <Button 
                onClick={() => setShowCompleteDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
            </Button>
        </div>
      </div>

      {/* DRIVER & BOX COUNT */}
      <Card className="bg-slate-50 border-slate-200">
        {/* <CardContent className="pt-6 grid grid-cols-2 gap-6"> */}
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label>Logistics / Driver</Label>
                <Select onValueChange={setDriver}>
                  <SelectTrigger><SelectValue placeholder="Select Driver" /></SelectTrigger>
                  <SelectContent>
                      {/* Mapping through our centralized drivers list */}
                      {DRIVERS.map((driverName) => (
                          <SelectItem key={driverName} value={driverName}>
                              {driverName}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label>Total Boxes Packaged</Label>
                <Input 
                   type="number" 
                   min={1} 
                   value={totalBoxes} 
                   onChange={(e) => handleBoxCountChange(Number(e.target.value))} 
                />
            </div>
            <div className="space-y-2">
                <Label>Total Quantity</Label>
                <Input 
                   type="text" 
                   placeholder="enter total qty of the job"
                   value={totalQuantity} 
                   onChange={(e) => handleTotalQuantityChange(e.target.value)} 
                />
            </div>
        </CardContent>
      </Card>
      <div className="text-right my-5">
        {/* BUTTON FOR PRINT ALL GOES HERE */}
      </div>                
      {/* PACKAGE FORMS */}
      <div className="space-y-4">
        {packages.map((pkg, index) => (
           <Card key={index} className="border-l-4 border-l-blue-600">
             <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span className="flex items-center gap-2"><Box className="h-4 w-4" /> Package {index + 1} of {totalBoxes}</span>
                    <Button size="sm" variant="outline" onClick={() => triggerLabelPrint(pkg)}>
                        <Printer className="mr-2 h-4 w-4" /> Print Label
                    </Button>
                </CardTitle>
             </CardHeader>
             {/* <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4"> */}
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={pkg.size} onValueChange={(v) => updatePackage(index, "size", v as "A5" | "A4")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A5">A5 (Half Sheet)</SelectItem>
                            <SelectItem value="A4">A4 (Full Sheet)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* <div className="space-y-2">
                    <Label>Item No.</Label>
                    <Input value={pkg.itemNo} onChange={(e) => updatePackage(index, "itemNo", e.target.value)} />
                </div> */}

                <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input value={pkg.desc} onChange={(e) => updatePackage(index, "desc", e.target.value)} />
                </div>

                 <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input value={pkg.qty} onChange={(e) => handleQtyChange(index, e.target.value)} />
                </div>

                {/* <div className="space-y-2 md:col-span-5">
                    <Label>Remarks</Label>
                    <Input value={pkg.remarks} onChange={(e) => updatePackage(index, "remarks", e.target.value)} />
                </div> */}

             </CardContent>
           </Card>
        ))}
      </div>

      {/* --- HIDDEN PRINT TEMPLATES --- */}
      {/* These utilize the new separated components */}
      <div style={{ display: "none" }}>
         <LabelTemplate ref={labelRef} data={printData} size={printData?.size || null} />
         <MasterDeliveryNote ref={masterRef} job={job} driver={driver} packages={packages} totalQuantity={totalQuantity} salesPerson={job.salesPerson} />
         <AllLabelsTemplate ref={allLabelsRef} job={job} driver={driver} packages={packages} totalBoxes={totalBoxes} totalQuantity={totalQuantity} />
      </div>

      {/* --- CONFIRMATION DIALOG --- */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Job as Complete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will finish the job and move it from the Active Dashboard to the History Log. 
              You will be redirected to the Dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleMarkComplete} 
                className="bg-green-600 hover:bg-green-700 min-w-35"
                disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Complete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}