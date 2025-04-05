
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface AdminRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToRemove: string | null;
  adminType: "superior" | "inferior";
  onConfirm: () => void;
}

export function AdminRemoveDialog({
  open,
  onOpenChange,
  adminToRemove,
  adminType,
  onConfirm
}: AdminRemoveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove admin {adminToRemove} from {adminType} admins?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
