"use client"

import * as React from "react"
import { format, addDays } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export interface DateInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
  id?: string
  showPresets?: boolean
  presets?: { label: string; value: number }[]
}

export function DateInput({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  className,
  id,
  showPresets = true,
  presets = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "In 3 days", value: 3 },
    { label: "In a week", value: 7 },
    { label: "In 2 weeks", value: 14 },
  ]
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (date && minDate && date < minDate) return
    if (date && maxDate && date > maxDate) return

    onChange?.(date)
    setOpen(false)
  }

  const disabledDays = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const handlePresetClick = (daysToAdd: number) => {
    const newDate = addDays(new Date(), daysToAdd)
    if (!minDate || newDate >= minDate) {
      if (!maxDate || newDate <= maxDate) {
        onChange?.(newDate)
        setOpen(false)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Card className="max-w-[300px] py-4 border-0 shadow-none">
          <CardContent className="px-4">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleSelect}
              disabled={disabledDays}
              initialFocus
              defaultMonth={value}
              className="bg-transparent p-0 [--cell-size:2.375rem]"
              classNames={{
                day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_range_start: "bg-primary text-primary-foreground",
                day_range_end: "bg-primary text-primary-foreground",
                day_range_middle: "bg-accent text-accent-foreground",
              }}
            />
          </CardContent>
          {showPresets && (
            <CardFooter className="flex flex-wrap gap-2 border-t px-4 pb-0 pt-4">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </CardFooter>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  )
}