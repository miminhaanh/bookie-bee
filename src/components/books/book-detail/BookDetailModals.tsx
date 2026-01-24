import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRES } from "./utils";
import type { Book } from "@/hooks/useBooks";

interface BookDetailModalsProps {
  book: Book;
  showDeleteDialog: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  isEditOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  onSaveEdit: (data: {
    title: string;
    author: string;
    description: string;
    genre: string;
  }) => void;
}

export function BookDetailModals({
  book,
  showDeleteDialog,
  onDeleteDialogChange,
  onDeleteConfirm,
  isEditOpen,
  onEditOpenChange,
  onSaveEdit,
}: BookDetailModalsProps) {
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author || "");
  const [editDesc, setEditDesc] = useState(book.description || "");
  const [editGenre, setEditGenre] = useState(book.genre || "");
  const handleSave = () => {
    onSaveEdit({
      title: editTitle,
      author: editAuthor,
      description: editDesc,
      genre: editGenre,
    });
  };

  return (
    <>
      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={onDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sách này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={onEditOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin sách</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cơ bản của sách
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Tên sách</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-author">Tác giả</Label>
              <Input
                id="edit-author"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Mô tả</Label>
              <Textarea
                id="edit-desc"
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-genre">Thể loại</Label>
              <Select value={editGenre} onValueChange={setEditGenre}>
                <SelectTrigger id="edit-genre">
                  <SelectValue placeholder="Chọn thể loại" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onEditOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
