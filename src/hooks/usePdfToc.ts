import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TocItem } from "@/hooks/useBooks";

const PDF_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

interface PDFOutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items?: PDFOutlineItem[];
}

interface UsePdfTocResult {
  toc: TocItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to extract Table of Contents (outline) from a PDF file
 */
export function usePdfToc(fileUrl: string | null | undefined): UsePdfTocResult {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) {
      setToc([]);
      return;
    }

    const ext = fileUrl.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      setToc([]);
      return;
    }

    let cancelled = false;

    const extractToc = async () => {
      setIsLoading(true);
      setError(null);
      console.log("[usePdfToc] Starting TOC extraction for:", fileUrl);

      try {
        // Dynamically import pdfjs
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

        // Fetch the PDF
        let pdfData: ArrayBuffer;
        const isAbsolute = /^https?:\/\//i.test(fileUrl);
        console.log("[usePdfToc] URL type:", isAbsolute ? "absolute" : "relative (Supabase storage)");

        if (!isAbsolute) {
          // Download from Supabase storage
          console.log("[usePdfToc] Downloading from Supabase storage bucket 'book-files':", fileUrl);
          const { data, error: downloadError } = await supabase.storage
            .from("book-files")
            .download(fileUrl);
          if (downloadError) {
            console.error("[usePdfToc] Supabase download error:", downloadError);
            throw downloadError;
          }
          console.log("[usePdfToc] Download successful, size:", data.size);
          pdfData = await data.arrayBuffer();
        } else {
          console.log("[usePdfToc] Fetching from URL:", fileUrl);
          const response = await fetch(fileUrl, { credentials: "include" });
          if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
          pdfData = await response.arrayBuffer();
        }

        if (cancelled) return;

        // Load the PDF document
        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        console.log("[usePdfToc] PDF loaded, pages:", pdf.numPages);

        if (cancelled) return;

        // Get the outline (TOC)
        const outline = await pdf.getOutline();
        console.log("[usePdfToc] Outline result:", outline ? `${outline.length} items` : "no outline");

        if (cancelled) return;

        if (!outline || outline.length === 0) {
          console.log("[usePdfToc] No TOC found in PDF");
          setToc([]);
          setIsLoading(false);
          return;
        }

        // Convert PDF outline to our TocItem format
        const convertOutline = async (items: PDFOutlineItem[]): Promise<TocItem[]> => {
          const result: TocItem[] = [];

          for (const item of items) {
            let page: number | null = null;

            // Try to resolve the destination to a page number
            if (item.dest) {
              try {
                let destArray: unknown[] | null = null;
                
                if (typeof item.dest === "string") {
                  // Named destination
                  destArray = await pdf.getDestination(item.dest);
                } else if (Array.isArray(item.dest)) {
                  destArray = item.dest;
                }

                if (destArray && destArray.length > 0) {
                  const pageRef = destArray[0];
                  if (pageRef && typeof pageRef === "object" && "num" in pageRef) {
                    // It's a page reference object
                    const pageIndex = await pdf.getPageIndex(pageRef as { num: number; gen: number });
                    page = pageIndex + 1; // Convert to 1-based
                  }
                }
              } catch {
                // Destination resolution failed, page will be null
              }
            }

            const children = item.items && item.items.length > 0
              ? await convertOutline(item.items)
              : [];

            result.push({
              title: item.title || "Untitled",
              page,
              items: children,
            });
          }

          return result;
        };

        const tocItems = await convertOutline(outline);
        console.log("[usePdfToc] Extracted TOC items:", tocItems.length);
        
        if (!cancelled) {
          setToc(tocItems);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[usePdfToc] Failed to extract TOC:", err);
          setError(err instanceof Error ? err.message : "Failed to extract TOC");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    extractToc();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return { toc, isLoading, error };
}
