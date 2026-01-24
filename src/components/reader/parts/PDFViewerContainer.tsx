import { Worker, Viewer, type DocumentLoadEvent, type PageChangeEvent, type ZoomEvent, type ViewMode } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import "@react-pdf-viewer/bookmark/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";

const PDF_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

interface PDFViewerContainerProps {
  fileUrl: string;
  plugins: any[];
  onDocumentLoad?: (e: DocumentLoadEvent) => void;
  onPageChange?: (e: PageChangeEvent) => void;
  onZoom?: (e: ZoomEvent) => void;
  defaultScale?: number;
  viewMode?: ViewMode;
}

export const PDFViewerContainer = ({
  fileUrl,
  plugins,
  onDocumentLoad,
  onPageChange,
  onZoom,
  defaultScale,
  viewMode,
}: PDFViewerContainerProps) => {
  return (
    <div className="flex-1 h-full overflow-hidden relative">
      <Worker workerUrl={PDF_WORKER_URL}>
        <Viewer
          fileUrl={fileUrl}
          plugins={plugins}
          onDocumentLoad={onDocumentLoad}
          onPageChange={onPageChange}
          onZoom={onZoom}
          defaultScale={defaultScale}
          viewMode={viewMode}
        />
      </Worker>
    </div>
  );
};
