import type { ComponentProps, ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  error?: string;
  isInvalid?: boolean;
  status?: string;
  messageClassName?: string;
};

export function FormField({
  name,
  label,
  error,
  isInvalid = Boolean(error),
  status,
  messageClassName,
  ...inputProps
}: FormFieldProps): ReactElement {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5 pb-1.5">
      <Label htmlFor={name} className="text-[13px] font-medium">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        // In the design, an invalid field looks normal and only the message is red.
        className="aria-invalid:border-input aria-invalid:ring-ring/50 aria-invalid:focus-visible:ring-3 h-11.5 rounded-[10px] aria-invalid:ring-0"
        {...inputProps}
      />
      {/* Always rendered with a fixed minimum height, so an error appearing
          doesn't move the fields and button below it. */}
      <p
        id={errorId}
        aria-live="polite"
        className={cn(
          "-mt-0.5 min-h-4 text-xs leading-4",
          error ? "text-destructive" : "text-muted-foreground",
          messageClassName,
        )}
      >
        {error ?? status}
      </p>
    </div>
  );
}
