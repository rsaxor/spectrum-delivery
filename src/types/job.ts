import { Timestamp } from "firebase/firestore";

export interface Job {
  id?: string;
  client: string;
  jobName: string;
  location: string;
  invoiceNo: string;
  deliveryNo?: string;
  status?: string;
  completedAt?: Timestamp;
  driver?: string;
  salesPerson?: string;
  deliveryType?: string;
  deliveryDate: string;
  contactNo?: string;
}

export interface Package {
  id: number;
  size: "A4" | "A5";
  // itemNo: string;
  desc: string;
  qty: string;
  // remarks: string;
}

export interface PrintData extends Package {
  job: Job;
  driver: string;
  totalBoxes: number;
  totalQuantity?: string;
}