import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import React, { useState } from "react";

interface InlineEditFormProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export const InlineEditForm: React.FC<InlineEditFormProps> = ({
  initialValue,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    }
  };

  return (
    <div
      className="flex items-center gap-1 flex-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 h-6 text-xs"
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-5 w-5 p-0"
        disabled={!value.trim()}
        onClick={(e) => {
          e.stopPropagation();
          handleSave();
        }}
      >
        <Check className="w-2.5 h-2.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-5 w-5 p-0"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        <X className="w-2.5 h-2.5" />
      </Button>
    </div>
  );
};
