
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { isValid } from "date-fns";
import { toast } from "sonner";
import { parseSlotDateTime, getTimePickerValues, safeFormat } from "@/utils/dateFormatUtils";

interface DateTimePickerProps {
  value: string;
  onChange: (date: Date) => void;
  align?: "start" | "center" | "end";
}

export function DateTimePicker({ value, onChange, align = "end" }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const { hours, minutes, periods } = getTimePickerValues();
  
  // Safely parse the date and provide a fallback if invalid
  const selectedDate = parseSlotDateTime(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-h-[600px]" align={align} sideOffset={8}>
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                try {
                  const currentDateTime = selectedDate;
                  const newDate = new Date(date);
                  newDate.setHours(
                    currentDateTime.getHours(),
                    currentDateTime.getMinutes()
                  );
                  onChange(newDate);
                } catch (error) {
                  console.error("Error selecting date:", error);
                  toast.error("Error selecting date");
                }
              }
            }}
            initialFocus
            className="pointer-events-auto border-b w-full"
          />
          <div className="p-3 border-t">
            <p className="text-sm font-medium mb-2">Time</p>
            <div className="flex items-center gap-2">
              <div className="relative w-20">
                <Select 
                  value={safeFormat(selectedDate, 'hh', '12')}
                  onValueChange={(hour) => {
                    try {
                      const date = new Date(selectedDate);
                      const isPM = date.getHours() >= 12;
                      const hourValue = parseInt(hour, 10);
                      date.setHours(isPM ? (hourValue === 12 ? 12 : hourValue + 12) : (hourValue === 12 ? 0 : hourValue));
                      onChange(date);
                    } catch (error) {
                      console.error("Error setting hour:", error);
                      toast.error("Error setting hour");
                    }
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-40">
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <span className="flex items-center">:</span>
              <div className="relative w-20">
                <Select 
                  value={safeFormat(selectedDate, 'mm', '00')}
                  onValueChange={(minute) => {
                    try {
                      const date = new Date(selectedDate);
                      date.setMinutes(parseInt(minute));
                      onChange(date);
                    } catch (error) {
                      console.error("Error setting minute:", error);
                      toast.error("Error setting minute");
                    }
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-40">
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-20">
                <Select 
                  value={safeFormat(selectedDate, 'a', 'AM')}
                  onValueChange={(period) => {
                    try {
                      const date = new Date(selectedDate);
                      const currentHour = date.getHours();
                      const isPM = period === 'PM';
                      
                      if (isPM && currentHour < 12) {
                        date.setHours(currentHour + 12);
                      } else if (!isPM && currentHour >= 12) {
                        date.setHours(currentHour - 12);
                      }
                      
                      onChange(date);
                    } catch (error) {
                      console.error("Error setting period:", error);
                      toast.error("Error setting AM/PM");
                    }
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="w-full mt-3" 
              onClick={() => {
                setOpen(false);
                toast.success("Time confirmed");
              }}
            >
              <Check className="h-4 w-4 mr-2" /> Confirm Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
