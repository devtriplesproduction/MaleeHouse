import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DatePickerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        <input
          type="date"
          ref={ref}
          className={cn(
            "glass-input w-full pl-10 pr-4 appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "transition-all duration-300 focus:ring-2 focus:ring-indigo-500/50 hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]",
            className
          )}
          {...props}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 transition-colors pointer-events-none">
          <CalendarIcon className="h-4 w-4" />
        </div>
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker }
