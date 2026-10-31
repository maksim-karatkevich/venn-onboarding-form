"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  personalDetailsSchema,
  type PersonalDetails,
} from "../schemas/personalDetailsSchema";
import { FormField } from "./FormField";

export function PersonalDetailsStep() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalDetails>({
    resolver: zodResolver(personalDetailsSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      corporationNumber: "",
    },
  });

  return (
    <form noValidate onSubmit={handleSubmit(() => undefined)}>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <FormField
          id="firstName"
          label="First Name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <FormField
          id="lastName"
          label="Last Name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>
      <FormField
        id="phone"
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <FormField
        id="corporationNumber"
        label="Corporation Number"
        autoComplete="off"
        error={errors.corporationNumber?.message}
        {...register("corporationNumber")}
      />
      <Button
        type="submit"
        className="mt-3.5 h-11.5 w-full rounded-[10px] font-normal"
      >
        Submit
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
