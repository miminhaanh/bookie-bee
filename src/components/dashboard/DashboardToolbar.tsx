import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DashboardToolbarProps {
  onSearch: (query: string) => void;
}

export function DashboardToolbar({ onSearch }: DashboardToolbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
          value={searchQuery}
          onChange={handleSearch}
          className="pl-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm border-border/50 focus:border-warm-pink focus:ring-warm-pink/20 transition-all"
        />
      </div>

      {/* Upload Button */}
      <Button
        onClick={() => navigate('/add-book')}
        className="h-12 px-6 rounded-xl bg-gradient-to-r from-warm-pink to-coral hover:from-warm-pink/90 hover:to-coral/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all gap-2"
      >
        <Upload className="w-5 h-5" />
        <span>Tải sách lên</span>
      </Button>
    </div>
  );
}
