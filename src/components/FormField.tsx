import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  error?: string;
  status?: string;
  messageClassName?: string;
};

export function FormField({
  name,
  label,
  error,
  status,
  messageClassName,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5 pb-1.5">
      <Label htmlFor={name} className="text-[13px] font-normal">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11.5 rounded-[10px]"
        {...inputProps}
      />
      {/* Always rendered with a fixed minimum height, so an error appearing
          doesn't move the fields and button below it. */}
      <p
        id={errorId}
        aria-live="polite"
        className={cn(
          "min-h-5 text-xs leading-5",
          error ? "text-destructive" : "text-muted-foreground",
          messageClassName,
        )}
      >
        {error ?? status}
      </p>
    </div>
  );
}
