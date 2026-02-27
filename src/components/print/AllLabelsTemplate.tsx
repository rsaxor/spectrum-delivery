import { forwardRef } from "react";
import { Job, Package } from "@/types/job";
import { LabelTemplate } from "./LabelTemplate";

interface AllLabelsTemplateProps {
  job: Job | null;
  driver: string;
  totalBoxes: number;
  totalQuantity: string;
  packages: Package[];
}

export const AllLabelsTemplate = forwardRef<HTMLDivElement, AllLabelsTemplateProps>(
  ({ job, driver, totalBoxes, totalQuantity, packages }, ref) => {
    if (!job || packages.length === 0) return null;

    // Group the packages into physical A4 pages
    const pages: Package[][] = [];
    let currentA5Pair: Package[] = [];

    packages.forEach((pkg) => {
      if (pkg.size === "A4") {
        // If it's an A4 label, flush any pending A5s to a page, then give A4 its own page
        if (currentA5Pair.length > 0) {
          pages.push([...currentA5Pair]);
          currentA5Pair = [];
        }
        pages.push([pkg]);
      } else {
        // It's an A5 label, pair it up!
        currentA5Pair.push(pkg);
        if (currentA5Pair.length === 2) {
          pages.push([...currentA5Pair]);
          currentA5Pair = []; // Reset pair after reaching 2
        }
      }
    });
    
    // Flush any leftover A5 label (e.g., if there is an odd number of A5 boxes like 3 or 5)
    if (currentA5Pair.length > 0) {
      pages.push([...currentA5Pair]);
    }

    return (
      <div ref={ref}>
        {pages.map((pagePackages, index) => (
          <div 
            key={index} 
            className="" 
            style={{ 
              width: '210mm', 
              height: '297mm', // Force the wrapper to act as an A4 sheet
              pageBreakAfter: 'always', // Force printer to next page after this chunk
              overflow: 'hidden'
            }}
          >
            {pagePackages.map((pkg) => (
              // Reuse exact LabelTemplate
              <LabelTemplate
                key={pkg.id}
                data={{ ...pkg, job, driver, totalBoxes, totalQuantity }}
                size={pkg.size}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

AllLabelsTemplate.displayName = "AllLabelsTemplate";