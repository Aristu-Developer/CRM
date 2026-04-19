import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  hint?:    string;
  leftAddon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {leftAddon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-lg border text-sm transition",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
            leftAddon && "pl-9",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-lg border text-sm transition bg-white",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          error ? "border-red-400" : "border-gray-300",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-lg border text-sm transition resize-none",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
