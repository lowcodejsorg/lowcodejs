import { Button } from "../ui/button";
import { PrinterIcon } from "lucide-react";

export function DocumentPrintButton({ onClick }: { onClick: () => void }) {
    return (
        <Button onClick={onClick} variant="ghost" className="p-0 z-50 flex cursor-pointer items-center gap-2 absolute top-2 right-2 no-print">
            <PrinterIcon className="size-5" />
        </Button>
    );
}