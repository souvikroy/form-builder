
"use client";
import React, { useEffect, useState } from 'react';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { FormElement, FormElementOption, OptionsFormElement, TableFormElement as TableFormElementType } from '@/lib/types'; // Added TableFormElementType
import { PlusCircle, Trash2 } from 'lucide-react';

export default function PropertyEditor() {
  const { selectedElement, updateElement, updateOption, addOption, removeOption } = useFormBuilder();
  const [formData, setFormData] = useState<Partial<FormElement> | null>(null);

  useEffect(() => {
    if (selectedElement) {
      setFormData({ ...selectedElement });
    } else {
      setFormData(null);
    }
  }, [selectedElement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedElement) return;
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = value === '' ? undefined : parseInt(value, 10); // Use parseInt for integer values like rows/cols
      if (isNaN(processedValue)) processedValue = undefined; // Ensure NaN becomes undefined
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    updateElement(selectedElement.id, { [name]: processedValue });
  };

  const handleOptionChange = (optionId: string, field: keyof FormElementOption, value: string) => {
    if (!selectedElement || (selectedElement.type !== 'dropdown' && selectedElement.type !== 'radio')) return;
    updateOption(selectedElement.id, optionId, { [field]: value });
  };

  const handleAddOption = () => {
    if (!selectedElement || (selectedElement.type !== 'dropdown' && selectedElement.type !== 'radio')) return;
    addOption(selectedElement.id);
  };

  const handleRemoveOption = (optionId: string) => {
    if (!selectedElement || (selectedElement.type !== 'dropdown' && selectedElement.type !== 'radio')) return;
    removeOption(selectedElement.id, optionId);
  };


  if (!selectedElement || !formData) {
    return (
      <aside className="w-80 border-l border-border bg-card p-6 shadow-md flex flex-col items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Properties</p>
          <p className="text-sm">Select an element on the canvas to edit its properties.</p>
        </div>
      </aside>
    );
  }

  const renderCommonProperties = () => (
    <>
      <div className="space-y-1">
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" value={formData.label || ''} onChange={handleChange} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">Name / ID</Label>
        <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} />
        <p className="text-xs text-muted-foreground">Unique identifier for this field.</p>
      </div>
      { (selectedElement.type !== 'checkbox' && selectedElement.type !== 'radio' && selectedElement.type !== 'file' && selectedElement.type !== 'table') &&
        <div className="space-y-1">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input id="placeholder" name="placeholder" value={formData.placeholder || ''} onChange={handleChange} />
        </div>
      }
       <div className="space-y-1">
        <Label htmlFor="helperText">Helper Text</Label>
        <Textarea id="helperText" name="helperText" value={formData.helperText || ''} onChange={handleChange} rows={2} />
        <p className="text-xs text-muted-foreground">Optional text displayed below the field.</p>
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox id="required" name="required" checked={!!formData.required} onCheckedChange={(checked) => {
            if (!selectedElement) return;
            const value = !!checked;
            setFormData(prev => ({...prev, required: value}));
            updateElement(selectedElement.id, { required: value });
        }}/>
        <Label htmlFor="required">Required</Label>
      </div>
    </>
  );
  
  const renderSpecificProperties = () => {
    switch (selectedElement.type) {
      case 'text':
      case 'textarea':
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="minLength">Min Length</Label>
              <Input id="minLength" name="minLength" type="number" value={formData.minLength || ''} onChange={handleChange} min="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxLength">Max Length</Label>
              <Input id="maxLength" name="maxLength" type="number" value={formData.maxLength || ''} onChange={handleChange} min="0" />
            </div>
            {selectedElement.type === 'textarea' && (
              <div className="space-y-1">
                <Label htmlFor="rows">Rows</Label>
                <Input id="rows" name="rows" type="number" value={(formData as any).rows || ''} onChange={handleChange} min="1"/>
              </div>
            )}
          </>
        );
      case 'number':
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="min">Min Value</Label>
              <Input id="min" name="min" type="number" value={formData.min === undefined ? '' : formData.min} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max">Max Value</Label>
              <Input id="max" name="max" type="number" value={formData.max === undefined ? '' : formData.max} onChange={handleChange} />
            </div>
          </>
        );
      case 'dropdown':
      case 'radio':
        const optionsElement = formData as OptionsFormElement;
        return (
          <div className="space-y-3">
            <Label>Options</Label>
            {optionsElement.options?.map((opt, index) => (
              <Card key={opt.id} className="p-3 bg-muted/30">
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <p className="text-sm font-medium text-foreground">Option {index + 1}</p>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveOption(opt.id)}>
                        <Trash2 size={14} />
                     </Button>
                   </div>
                  <div className="space-y-1">
                    <Label htmlFor={`option-label-${opt.id}`} className="text-xs">Label</Label>
                    <Input id={`option-label-${opt.id}`} value={opt.label} onChange={(e) => handleOptionChange(opt.id, 'label', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`option-value-${opt.id}`} className="text-xs">Value</Label>
                    <Input id={`option-value-${opt.id}`} value={opt.value} onChange={(e) => handleOptionChange(opt.id, 'value', e.target.value)} />
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddOption} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </div>
        );
      case 'file':
        return (
          <div className="space-y-1">
            <Label htmlFor="accept">Accepted File Types</Label>
            <Input id="accept" name="accept" value={(formData as any).accept || ''} onChange={handleChange} placeholder="e.g., image/*, .pdf" />
            <p className="text-xs text-muted-foreground">Comma-separated (e.g. image/*, .pdf)</p>
          </div>
        );
      case 'table': // Added properties for Table element
        const tableFormData = formData as Partial<TableFormElementType>;
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="rows">Number of Rows</Label>
              <Input id="rows" name="rows" type="number" value={tableFormData.rows || ''} onChange={handleChange} min="1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cols">Number of Columns</Label>
              <Input id="cols" name="cols" type="number" value={tableFormData.cols || ''} onChange={handleChange} min="1" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-80 border-l border-border bg-card shadow-md">
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-lg font-semibold text-foreground">Properties: {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}</CardTitle>
      </CardHeader>
      <Separator />
      <ScrollArea className="h-[calc(100vh-8rem)]"> 
        <CardContent className="p-6 space-y-4">
          {renderCommonProperties()}
          <Separator className="my-4" />
          {renderSpecificProperties()}
        </CardContent>
      </ScrollArea>
    </aside>
  );
}
