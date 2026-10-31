import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";

export function PersonalDetailsStep() {
  return (
    <form noValidate>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <FormField
          id="firstName"
          label="First Name"
          autoComplete="given-name"
        />
        <FormField id="lastName" label="Last Name" autoComplete="family-name" />
      </div>
      <FormField
        id="phone"
        label="Phone Number"
        type="tel"
        autoComplete="tel"
      />
      <FormField
        id="corporationNumber"
        label="Corporation Number"
        autoComplete="off"
      />
      <Button
        type="submit"
        className="mt-5 h-11.5 w-full rounded-[10px] font-normal"
      >
        Submit
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
