import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { useBooks } from "@/hooks/useBooks";

type UpdateBookMutation = ReturnType<typeof useBooks>["updateBook"];

type UseSaveReadingProgressParams = {
  bookId?: string;
  enabled?: boolean;
  currentPage: number;
  denom?: number | null;
  debounceMs?: number;
  updateBook: UpdateBookMutation;
  onHydratePage?: (page: number) => void;
};

const clampPage = (page: number) => (Number.isFinite(page) && page > 0 ? Math.floor(page) : 1);

export function useSaveReadingProgress({
  bookId,
  enabled = true,
  currentPage,
  denom,
  debounceMs = 1200,
  updateBook,
  onHydratePage,
}: UseSaveReadingProgressParams) {
  const { user } = useAuth();
  const [hydratedPage, setHydratedPage] = useState<number | null>(null);

  // 1. THÊM STATE NÀY: Cờ đánh dấu đã tải xong dữ liệu cũ từ DB chưa
  const [isHydrated, setIsHydrated] = useState(false);

  const lastSavedPageRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedOnceRef = useRef(false);

  const latestPageRef = useRef(currentPage);

  const canRun = !!enabled && !!user?.id && !!bookId;

  // Cập nhật ref mỗi khi currentPage thay đổi để tránh stale closure
  useEffect(() => {
    latestPageRef.current = currentPage;
  }, [currentPage]);

  const getProgress = useCallback((page: number) => {
    const d = typeof denom === "number" && denom > 0 ? denom : null;
    if (!d) return null;
    const pct = (page / d) * 100;
    if (!Number.isFinite(pct)) return null;
    return Math.max(0, Math.min(100, pct));
  }, [denom]);

  const saveNow = useCallback(
    (page: number) => {
      // Điều này ngăn việc trang 1 (mặc định) ghi đè lên trang 50 (trong DB) khi mới mở sách.
      if (!canRun || !bookId || !isHydrated) return;

      const nextPage = clampPage(page);

      // Avoid duplicate writes
      if (lastSavedPageRef.current === nextPage) return;

      const delta = nextPage - (lastSavedPageRef.current ?? 1);

      // Update stats atomically via RPC if there's a positive delta
      if (delta > 0) {
        // We catch error silently here to not block the UI save
        // @ts-ignore - RPC types might not be generated yet
        const localDate = new Date();
        const offset = localDate.getTimezoneOffset() * 60000;
        const localDateStr = new Date(localDate.getTime() - offset).toISOString().split("T")[0];

        supabase.rpc("increment_daily_stats", {
          p_user_id: user?.id,
          p_date: localDateStr,
          p_delta_pages: delta,
          p_delta_seconds: 0 // Seconds are handled by reading session
        }).then(({ error }) => {
          if (error) console.error("Failed to update daily stats:", error);
        });
      }

      const progress = getProgress(nextPage);

      updateBook.mutate({
        id: bookId,
        current_page: nextPage,
        ...(typeof progress === "number" ? { progress } : {}),
      });

      lastSavedPageRef.current = nextPage;
    },
    // Thêm dependency isHydrated
    [bookId, canRun, getProgress, updateBook, isHydrated, user?.id],
  );

  // Hydrate current page from DB on open
  useEffect(() => {
    if (!canRun || !bookId || !user?.id) return;

    let active = true;

    const run = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("current_page")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.warn("Failed to hydrate current page:", error);
        // Nếu lỗi, vẫn set isHydrated=true để người dùng có thể lưu tiến độ mới (fallback)
        setIsHydrated(true);
        return;
      }

      const dbPage = clampPage(typeof data?.current_page === "number" ? data.current_page : 1);
      setHydratedPage(dbPage);

      // Đồng bộ lastSavedPageRef với DB để tránh lưu lặp lại ngay sau khi hydrate
      lastSavedPageRef.current = dbPage;

      if (!hydratedOnceRef.current) {
        hydratedOnceRef.current = true;
        onHydratePage?.(dbPage);
      }

      // 3. ĐÁNH DẤU HOÀN THÀNH: Cho phép saveNow hoạt động từ thời điểm này
      setIsHydrated(true);
    };

    void run();
    return () => {
      active = false;
    };
  }, [bookId, canRun, onHydratePage, user?.id]);

  // Debounced save on page change
  useEffect(() => {
    // Thêm check !isHydrated để không chạy debounce khi chưa load xong
    if (!canRun || !isHydrated) return;

    const nextPage = clampPage(currentPage);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNow(nextPage);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [canRun, currentPage, debounceMs, saveNow, isHydrated]);

  // Flush on unmount
  useEffect(() => {
    if (!canRun) return;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      // saveNow đã có logic check isHydrated bên trong, nên an toàn
      saveNow(latestPageRef.current);
    };
  }, [canRun, saveNow]);

  return {
    hydratedPage,
    saveNow,
    isHydrated, // Trả về biến này để UI có thể hiện Loading nếu cần
  };
}