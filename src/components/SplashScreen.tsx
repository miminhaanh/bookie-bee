import { BookOpen } from "lucide-react";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Logo with blinking animation */}
      <div className="relative animate-pulse-glow rounded-full p-6">
        <BookOpen 
          className="h-24 w-24 text-primary animate-blink" 
          strokeWidth={1.5}
        />
        {/* Decorative pages */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 space-y-1">
          <div className="h-1 w-4 rounded-full bg-secondary opacity-60" />
          <div className="h-1 w-3 rounded-full bg-accent opacity-80" />
          <div className="h-1 w-4 rounded-full bg-secondary opacity-60" />
        </div>
      </div>

      {/* App name */}
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        Book<span className="text-primary">Worm</span>
      </h1>
      
      {/* Tagline */}
      <p className="mt-2 text-sm text-muted-foreground">
        Đọc sách thông minh
      </p>

      {/* Loading indicator */}
      <div className="mt-8 flex space-x-1.5">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default SplashScreen;