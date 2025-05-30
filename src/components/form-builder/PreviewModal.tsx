
"use client";
import React from 'react';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import type { FormElement as FormElementType, OptionsFormElement, TextareaFormElement, FileFormElement, TableFormElement as TableFormElementType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIconLucide } from "lucide-react" // Renamed to avoid conflict with ShadCN Calendar
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar'; // ShadCN Calendar

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewModal({ isOpen, onClose }: PreviewModalProps) {
  const { formDefinition } = useFormBuilder();
  const [dateValues, setDateValues] = React.useState<Record<string, Date | undefined>>({});

  const renderFormElement = (element: FormElementType) => {
    const commonProps = {
      id: element.id,
      name: element.name,
      required: element.required,
      defaultValue: element.defaultValue,
    };

    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x || 0}px`,
      top: `${element.y || 0}px`,
      width: element.width || '280px', 
    };

    return (
      <div key={element.id} style={elementStyle} className="p-3 border border-border rounded-lg shadow-sm bg-card">
        <Label htmlFor={element.id} className="block text-md font-medium mb-1.5 text-foreground">
          {element.label}
          {element.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {element.helperText && <p className="text-xs text-muted-foreground mb-1.5">{element.helperText}</p>}
        
        {(() => {
          switch (element.type) {
            case 'text':
            case 'number':
            case 'email':
              return <Input type={element.type} placeholder={element.placeholder} {...commonProps} className="bg-input"/>;
            case 'textarea':
              const textareaEl = element as TextareaFormElement;
              return <Textarea placeholder={textareaEl.placeholder} rows={textareaEl.rows || 3} {...commonProps} className="bg-input"/>;
            case 'dropdown':
              const dropdownEl = element as OptionsFormElement;
              return (
                <Select name={element.name} required={element.required} defaultValue={element.defaultValue}>
                  <SelectTrigger id={element.id} className="w-full bg-input">
                    <SelectValue placeholder={element.placeholder || "Select an option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownEl.options.map(opt => (
                      <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            case 'radio':
              const radioEl = element as OptionsFormElement;
              return (
                <RadioGroup name={element.name} required={element.required} defaultValue={element.defaultValue} className="mt-2 space-y-2">
                  {radioEl.options.map(opt => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`${element.id}-${opt.id}`} />
                      <Label htmlFor={`${element.id}-${opt.id}`} className="font-normal">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              );
            case 'checkbox':
              return (
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id={element.id} name={element.name} defaultChecked={!!element.defaultValue} required={element.required} />
                  {/* The label for checkbox in preview is the element's main label as per typical form behavior */}
                  <Label htmlFor={element.id} className="font-normal">{element.label}</Label> 
                </div>
              );
            case 'date':
              return (
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      id={element.id} // Ensure ID is on the button for the label to target
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input",
                        !dateValues[element.id] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIconLucide className="mr-2 h-4 w-4" />
                      {dateValues[element.id] ? format(dateValues[element.id]!, "PPP") : <span>{element.placeholder || "Pick a date"}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateValues[element.id]}
                      onSelect={(date) => setDateValues(prev => ({...prev, [element.id]: date}))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              );
            case 'file':
              const fileEl = element as FileFormElement;
              return <Input type="file" accept={fileEl.accept} {...commonProps} className="bg-input" />;
            case 'table':
              const tableEl = element as TableFormElementType;
              return (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full border-collapse border border-border text-sm">
                    <tbody>
                      {Array.from({ length: tableEl.rows }).map((_, rIndex) => (
                        <tr key={rIndex} className="border-b border-border">
                          {Array.from({ length: tableEl.cols }).map((_, cIndex) => (
                            <td key={cIndex} className={`border-border p-2 h-10 bg-input/20 text-center text-muted-foreground ${cIndex < tableEl.cols -1 ? 'border-r' : ''}`}>
                              {/* Cell placeholder, actual input fields could be added here if needed */}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            default:
              return <p className="text-sm text-destructive">Unsupported element type in preview</p>;
          }
        })()}
      </div>
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (data[key]) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    Object.entries(dateValues).forEach(([elementId, date]) => {
        const formElement = formDefinition.find(el => el.id === elementId);
        if(formElement && date) {
            data[formElement.name] = format(date, "yyyy-MM-dd");
        }
    });
    console.log("Form Submitted (Preview):", data);
    alert("Form submitted! Check console for data. (This is a preview, data is not sent anywhere.)");
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Form Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6 py-4 bg-muted/10"> 
          {formDefinition.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center py-10">The form is empty. Add some elements to preview.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div 
                className="relative bg-background shadow-inner" 
                style={{ 
                  minWidth: '2500px', // Match canvas min-width
                  minHeight: '1800px', // Match canvas min-height
                  padding: '32px',      // Match canvas padding
                }}
              >
                {formDefinition.map(renderFormElement)}
              </div>
              <div className="mt-8 pt-6 border-t border-border px-6 pb-6 sticky bottom-0 bg-background z-10"> 
                <Button type="submit" className="w-full sm:w-auto" variant="default">Submit Preview</Button>
              </div>
            </form>
          )}
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t border-border">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close Preview</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
