import { useForm } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";

export const useFormValidation = <T extends FieldValues>(
  schema: ZodSchema<T>
): UseFormReturn<T> => {
  return useForm<T>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });
  
};