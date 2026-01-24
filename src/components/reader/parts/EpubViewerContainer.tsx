import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { sampleContent } from "../utils/readerUtils";

interface EpubViewerContainerProps {
  fileUrl: string;
  currentPage: number;
  totalPages: number | null;
  fontSize: number;
  fontFamily: "sans" | "serif";
  lineHeight: number;
  theme: {
    bg: string;
    text: string;
    name: string;
  };
}

export const EpubViewerContainer = ({
  fileUrl,
  currentPage,
  totalPages,
  fontSize,
  fontFamily,
  lineHeight,
  theme,
}: EpubViewerContainerProps) => {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    // For now, just show sample content
    // In real implementation, this would parse the EPUB file
    setContent(sampleContent);
  }, [fileUrl]);

  return (
    <div className={cn("flex-1 overflow-y-auto px-4 py-8", theme.bg, theme.text)}>
      <div
        className={cn(
          "mx-auto max-w-3xl",
          fontFamily === "serif" ? "font-serif" : "font-sans"
        )}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};
