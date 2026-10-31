import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
};

export function FormField({ id, label, error, ...inputProps }: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5 pb-1.5">
      <Label htmlFor={id} className="text-[13px] font-normal">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11.5 rounded-[10px]"
        {...inputProps}
      />
      {/* Always rendered with a fixed minimum height, so an error appearing
          doesn't move the fields and button below it. */}
      <p id={errorId} className="text-destructive min-h-5 text-xs leading-5">
        {error}
      </p>
    </div>
  );
}
