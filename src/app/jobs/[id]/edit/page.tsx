"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SALES_TEAM } from "@/lib/constants";


export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string; // This is the Invoice No

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 1. EXACT SAME FIELDS AS ADD JOB ---
  const [invoiceNo, setInvoiceNo] = useState(jobId);
  const [deliveryNo, setDeliveryNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [location, setLocation] = useState("");
  const [contactNo, setContactNo] = useState("");
  
  const [jobName, setJobName] = useState("");
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("Credit"); 

  // Get today's date for validation
  const today = new Date().toISOString().split("T")[0];

  // --- 2. FETCH DATA ---
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const docRef = doc(db, "jobs", jobId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Pre-fill state
          setInvoiceNo(data.invoiceNo || jobId);
          setDeliveryNo(data.deliveryNo || "");
          setDeliveryDate(data.deliveryDate || "");
          setLocation(data.location || "");
          setContactNo(data.contactNo || "");
          setJobName(data.jobName || "");
          setClient(data.client || "");
          setAmount(data.amount || "");
          setSalesPerson(data.salesPerson || "");
          setPaymentInfo(data.paymentInfo || "Credit");
        } else {
          toast.error("Job not found");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error loading job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, router]);

  // --- 3. HANDLE UPDATE ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Check for all required fields (Same as New Job)
    if (!client || !deliveryDate || !location || !jobName) {
      toast.error("Missing Information", {
        description: "Please fill in Delivery Date, Location, Client, and Job Name."
      });
      return;
    }

    setSaving(true);

    try {
      const docRef = doc(db, "jobs", jobId);
      
      await updateDoc(docRef, {
        // We do NOT update invoiceNo because it is the ID
        deliveryNo,
        deliveryDate,
        location,
        contactNo,
        jobName,
        client,
        amount: Number(amount),
        salesPerson,
        paymentInfo,
      });

      toast.success("Job Updated Successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading job details...</div>;

  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
           <h1 className="text-3xl font-bold">Edit Job</h1>
           <p className="text-gray-500">Updating details for Invoice #{jobId}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT: DELIVERY DETAILS (Same as Add Page) */}
        <Card>
          <CardHeader><CardTitle>Delivery Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery No.</Label>
              <Input 
                value={deliveryNo} 
                onChange={(e) => setDeliveryNo(e.target.value)} 
                placeholder="e.g. DN-2024-001" 
              />
            </div>
            <div className="space-y-2">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Delivery Date</Label>
              <Input 
                type="date" 
                min={today} // Block past dates
                value={deliveryDate} 
                onChange={(e) => setDeliveryDate(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Location</Label>
              <Input 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Dafza, Emaar, etc." 
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Contact No.</Label>
              <Input 
                value={contactNo} 
                onChange={(e) => setContactNo(e.target.value)} 
                placeholder="" 
              />
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: JOB INFO (Same as Add Page) */}
        <Card>
          <CardHeader><CardTitle>Job Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Invoice No (ID)</Label>
                    {/* DISABLED: Because this is the Database ID */}
                    <Input 
                      value={invoiceNo} 
                      disabled 
                      className="bg-gray-100 text-gray-500 cursor-not-allowed" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Amount (AED)</Label>
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="0.00" 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Client/Company Name</Label>
                <Input 
                  value={client} 
                  onChange={(e) => setClient(e.target.value)} 
                  required 
                />
            </div>

            <div className="space-y-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Job Name</Label>
                <Input 
                  value={jobName} 
                  onChange={(e) => setJobName(e.target.value)} 
                  placeholder="Business Cards" 
                  required
                />
            </div>

            <div className="space-y-2">
                <Label>Sales Person</Label>
                <Select value={salesPerson} onValueChange={setSalesPerson}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Sales" /></SelectTrigger>
                  <SelectContent>
                    {SALES_TEAM.map((salesTeamMember) => (
                        <SelectItem key={salesTeamMember} value={salesTeamMember}>
                            {salesTeamMember}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Payment Info</Label>
                <Select value={paymentInfo} onValueChange={setPaymentInfo}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Drop Sample">Drop Sample</SelectItem>
                    <SelectItem value="CC Payment">CC Payment</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partial Delivery">Partial Delivery</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>

        {/* BUTTON SECTION */}
        <div className="md:col-span-2">
            <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" 
                disabled={saving}
            >
                {saving ? "Updating..." : "Update Job Details"} 
                <Save className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </form>
    </div>
  );
}