import * as React from "react";
import {
  type FieldValues,
  FormProvider,
  useFormContext,
  type UseFormReturn
} from "react-hook-form";
import { cn } from "@/lib/utils";

export function Form<TFieldValues extends FieldValues>({
  form,
  children,
  className
}: {
  form: UseFormReturn<TFieldValues>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <FormProvider {...form}>
      <form className={className}>{children}</form>
    </FormProvider>
  );
}

export function FormField({
  name,
  render
}: {
  name: string;
  render: (props: {
    field: ReturnType<typeof useFormContext>["register"];
    error?: string;
  }) => React.ReactNode;
}) {
  const form = useFormContext();
  const {
    register,
    formState: { errors }
  } = form;

  const fieldError = (errors as Record<string, { message?: string }>)[name];

  return <>{render({ field: register, error: fieldError?.message })}</>;
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FormMessage({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-destructive">{children}</p>;
}
