"use client";

import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Select, SelectItem } from "./select";
import { cn } from "@/lib/utils";

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  options: FormSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  align?: "left" | "right";
  id?: string;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  options,
  placeholder = "Select an option",
  className,
  buttonClassName,
  disabled,
  align = "left",
  id,
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          id={id}
          value={field.value}
          onValueChange={field.onChange}
          placeholder={placeholder}
          className={className}
          buttonClassName={cn("glass-input", buttonClassName)}
          disabled={disabled || field.disabled}
          align={align}
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      )}
    />
  );
}
