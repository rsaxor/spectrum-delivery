import { forwardRef } from "react";
import { Job, Package } from "@/types/job";
import Image from "next/image";

interface MasterProps {
  job: Job | null;
  driver: string;
  packages: Package[];
  totalQuantity?: string;
  salesPerson?: string;
}

export const MasterDeliveryNote = forwardRef<HTMLDivElement, MasterProps>(({ job, driver, packages, totalQuantity, salesPerson }, ref) => {
  if (!job) return null;

  return (
    <div ref={ref} className="p-5 font-sans bg-white text-black sheet-a4 flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-green-900 p-5 text-white flower-bg">
        <div className="flex md:flex-row items-stretch">
          <div className="w-full">
            <Image
              src="/spec-white.png"
              alt="Spectrum logo"
              width={170}
              height={170}
              className={`print-logo h-auto object-contain block mx-auto`}
              priority
            />
            <div className="text-center text-xs mt-2">
              <p className="mb-0">Dubai International Financial Center</p>
              <p className="mb-0">Level B1, GD5, P.O. Box 482043, Dubai, UAE</p>
              <p className="mb-0">Tel: +971 4 362 0566 | Email: joborders@spectrumdubai.com</p>
              <p className="mb-0">www.spectrumdubai.com</p>
            </div>
          </div>
          <div className="w-full text-white md:mt-0 pl-5 flex flex-col justify-between">
            <div className="bg-white p-1 text-black">
              <p className="border-b border-green-900 mb-0 text-xs font-bold">
                Client: <br />
                <span className="w-full block font-normal text-sm">
                  {job?.client}
                </span>
              </p>
              <p className="border-b border-green-900 mb-0 text-xs mt-1 font-bold">
                Address: <br />
                <span className="w-full block font-normal text-sm">
                  {job?.location}
                </span>
              </p>
              <p className="border-b border-green-900 mb-0 text-xs mt-1 font-bold">
                Contact/Tel: <br />
                <span className="w-full block font-normal text-sm">
                  {job?.contactNo || ""}
                </span>
              </p>
            </div>
            <p className="tracking-normal font-black text-4xl uppercase text-right mt-1">Delivery</p>
          </div>
        </div>
      </div>
      <div className="">
        <table className="border-collapse mt-1 w-full">
          <tbody>
          <tr>
            <td>
              Invoice #: <span className="font-black">{job.invoiceNo}</span>
            </td>
            <td className="text-right">
              <p className="font-black text-xl my-2">{job.jobName}</p>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <table className="w-full mb-3 border-collapse mt-1 text-sm">
        <thead>
          <tr className="">
            <td className="border border-gray-500 p-2 text-right font-bold w-30 bg-green-50">
              Date
            </td>
            <td className="border border-gray-500 p-2">
              {new Date().toISOString().split("T")[0]}
            </td>
            <td className="border border-gray-500 p-2 text-right font-bold w-30 bg-green-50">
              Delivery No.
            </td>
            <td className="border border-gray-500 p-2">
              {job.deliveryNo || "N/A"}
            </td>
          </tr>
          <tr className="">
            <td className="border border-gray-500 p-2 text-right font-bold w-40 bg-green-50">Despatch Date</td>
            <td className="border border-gray-500 p-2">
              {job.deliveryDate}
            </td>
            <td className="border border-gray-500 p-2 text-right font-bold w-40 bg-green-50">Despatch Time</td>
            <td className="border border-gray-500 p-2"></td>
          </tr>
        </thead>
      </table>
      {/* TABLE */}
      <table className="w-full mb-12 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-green-800 text-white leading-none">
            <th className="border border-gray-500 px-2 py-3 text-center w-16">Pkg #</th>
            {/* <th className="border border-gray-500 px-2 py-3 text-left w-25">Item No.</th> */}
            <th className="border border-gray-500 px-2 py-3 text-left">Description</th>
            <th className="border border-gray-500 px-2 py-3 text-center w-24">Qty</th>
            {/* <th className="border border-gray-500 px-2 py-3 text-left">Remarks</th> */}
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg, i) => (
            <tr key={i} className="text-sm leading-none odd:bg-green-50">
              <td className="border border-gray-500 px-2 py-3 text-center font-bold">{pkg.id}</td>
              {/* <td className="border border-gray-500 px-2 py-3">{pkg.itemNo}</td> */}
              <td className="border border-gray-500 px-2 py-3">{pkg.desc}</td>
              <td className="border border-gray-500 px-2 py-3 text-center">{pkg.qty}</td>
              {/* <td className="border border-gray-500 px-2 py-3 text-sm leading-none">{pkg.remarks}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
      {/* FOOTER SIGNATURES */}
      <div className="mt-auto">
        <div className="flex flex-row justify-between">
          <p className="text-right my-3 text-md">{driver ? <>Logistic: <strong>{driver}</strong> | </> : <></>} Sales person: <strong>{salesPerson}</strong></p>
          <p className="text-right my-3 text-md">Total Job Quantity: <strong>{totalQuantity || "Missing"}</strong></p>
        </div>
        <div className="bg-green-900 print-footer text-white mt-auto flower-bg">
          <p className="font-bold mb-9 text-md">Checked by:</p>
          <div className="flex md:flex-row justify-end">
            <div className="w-full md:w-1/2">
              <p className="text-sm border-t border-white w-3/4">Signature</p>
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-sm border-t border-white w-3/4">Date</p>
            </div>
          </div>
        </div>
        </div>
    </div>
  );
});

MasterDeliveryNote.displayName = "MasterDeliveryNote";