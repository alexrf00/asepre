"use client"

import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangePickerProps) {
  const today = new Date()

  const presets = [
    {
      label: "This Month",
      getRange: () => ({
        start: startOfMonth(today),
        end: endOfMonth(today),
      }),
    },
    {
      label: "Last Month",
      getRange: () => {
        const lastMonth = subMonths(today, 1)
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        }
      },
    },
    {
      label: "This Quarter",
      getRange: () => ({
        start: startOfQuarter(today),
        end: endOfQuarter(today),
      }),
    },
    {
      label: "This Year",
      getRange: () => ({
        start: startOfYear(today),
        end: endOfYear(today),
      }),
    },
  ]

  const handlePreset = (preset: (typeof presets)[0]) => {
    const { start, end } = preset.getRange()
    onStartDateChange(start)
    onEndDateChange(end)
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button key={preset.label} variant="outline" size="sm" onClick={() => handlePreset(preset)}>
            {preset.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStartDateChange(undefined)
            onEndDateChange(undefined)
          }}
        >
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[160px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <span className="text-muted-foreground mt-5">to</span>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[160px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
