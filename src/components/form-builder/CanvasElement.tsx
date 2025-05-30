
"use client";
import React, { useRef } from 'react';
import type { XYCoord } from 'dnd-core';
import { useDrag, useDrop } from 'react-dnd';
import type { FormElement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar'; // For DatePicker, if using ShadCN
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import { ItemTypes } from './DraggableItem'; // For reordering

interface CanvasElementProps {
  element: FormElement;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string; // Should be ItemTypes.FORM_ELEMENT
}

export default function CanvasElement({ element, index, isSelected, onSelect, moveElement }: CanvasElementProps) {
  const { removeElement, setSelectedElement } = useFormBuilder();
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: any }>({
    accept: ItemTypes.FORM_ELEMENT, // Accept elements from sidebar and other canvas elements for reordering
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      // If item.type is from sidebar, it won't have item.index - this is for reordering existing elements
      if (item.index === undefined) return; 
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveElement(dragIndex, hoverIndex);
      item.index = hoverIndex; // Mutate the item to avoid re-triggering
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.FORM_ELEMENT, // Mark this as a draggable form element for reordering
    item: () => ({ id: element.id, index, type: ItemTypes.FORM_ELEMENT }), // Add type for consistency
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref)); // Attach both drag and drop to the same ref for reordering

  const renderElementPreview = () => {
    // This is a simplified preview for the canvas.
    // Actual form rendering for preview modal would be more detailed.
    switch (element.type) {
      case 'text':
      case 'number':
      case 'email':
        return <Input type={element.type} placeholder={element.placeholder} defaultValue={element.defaultValue} readOnly className="mt-1 bg-muted/30" />;
      case 'textarea':
        return <Textarea placeholder={element.placeholder} defaultValue={element.defaultValue} rows={(element as any).rows || 3} readOnly className="mt-1 bg-muted/30" />;
      case 'dropdown':
        return (
          <Select defaultValue={element.defaultValue} disabled>
            <SelectTrigger className="w-full mt-1 bg-muted/30">
              <SelectValue placeholder={element.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {(element as any).options.map((opt: any) => (
                <SelectItem key={opt.id || opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <div className="mt-1 space-y-1">
            {(element as any).options.map((opt: any) => (
              <div key={opt.id || opt.value} className="flex items-center gap-2">
                <input type="radio" name={element.name} value={opt.value} defaultChecked={element.defaultValue === opt.value} disabled className="form-radio h-4 w-4" />
                <Label htmlFor={opt.id || opt.value} className="text-sm">{opt.label}</Label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center mt-1 gap-2">
            <Checkbox id={element.id} defaultChecked={element.defaultValue} disabled />
            <Label htmlFor={element.id} className="text-sm">{element.label}</Label> 
            {/* Checkbox on canvas usually doesn't re-render its own label like this, it's part of the header. 
                This specific label is for the checkbox functionality itself. The overall element label is in CardHeader.
                So, this should be `element.label` if checkbox is a single element, or empty if part of group.
                For simplicity, using element.label here but in properties it would be different. Let's make it static for now.
            */}
          </div>
        );
      case 'date':
        return <Input type="date" defaultValue={element.defaultValue} readOnly className="mt-1 bg-muted/30" />;
      case 'file':
        return <Input type="file" disabled className="mt-1 bg-muted/30" />;
      default:
        return <p className="text-sm text-muted-foreground">Unsupported element type</p>;
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when deleting
    removeElement(element.id);
    if (isSelected) {
      setSelectedElement(null);
    }
  };

  return (
    <div ref={preview} style={{ opacity: isDragging ? 0.5 : 1 }} data-handler-id={handlerId}>
      <Card
        ref={ref}
        onClick={onSelect}
        className={`cursor-pointer transition-all duration-150 ease-in-out shadow-md hover:shadow-lg relative group
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border'}
          ${isDragging ? 'border-dashed border-primary' : ''}
        `}
      >
        <CardHeader className="py-3 px-4 bg-muted/50 rounded-t-lg flex flex-row items-center justify-between ">
          <div className="flex items-center gap-2">
            <div ref={drag} className="cursor-move p-1 -ml-1 text-muted-foreground hover:text-foreground" aria-label="Drag to reorder">
              <GripVertical size={18} />
            </div>
            <CardTitle className="text-base font-medium text-foreground truncate" title={element.label}>
              {element.label || `${element.type} Field`}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            aria-label="Remove element"
          >
            <Trash2 size={16} />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {/* Minimal preview for canvas, doesn't need full label again if in header */}
          {element.type !== 'checkbox' && element.placeholder && (
             <p className="text-xs text-muted-foreground mb-1">Placeholder: {element.placeholder}</p>
          )}
          {renderElementPreview()}
        </CardContent>
      </Card>
    </div>
  );
}
