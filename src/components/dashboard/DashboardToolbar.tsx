import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardToolbarProps {
  onSearch: (query: string) => void;
}

export function DashboardToolbar({ onSearch }: DashboardToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
        value={searchQuery}
        onChange={handleSearch}
        className="pl-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 focus:border-warm-pink focus:ring-warm-pink/20 transition-all"
      />
    </div>
  );
}
