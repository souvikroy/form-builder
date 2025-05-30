
"use client";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import type { FormElement, TableFormElement as TableFormElementType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import { ItemTypes } from './DraggableItem';

interface CanvasElementProps {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
}

interface DragItem {
  id: string;
  type: string; // Should match ItemTypes.FORM_ELEMENT
  originalX: number;
  originalY: number;
}

const MIN_WIDTH = 100; // Minimum width in pixels for an element

export default function CanvasElement({ element, isSelected, onSelect }: CanvasElementProps) {
  const { removeElement, setSelectedElement, updateElement } = useFormBuilder();
  const cardRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialMouseX, setInitialMouseX] = useState(0);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.FORM_ELEMENT,
    item: (): DragItem => ({ // This is called when drag starts
      id: element.id,
      type: ItemTypes.FORM_ELEMENT, // Explicitly set item type
      originalX: element.x || 0, // Store initial canvas coordinates
      originalY: element.y || 0,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      // The dropResult helps identify if it was dropped on a specific target like the main canvas.
      // However, for free-form dragging, we want the element to update its position based on where
      // it was released, regardless of whether it was technically over the 'canvas' drop target
      // or even outside the viewport briefly.
      // The `(monitor.getDropResult() as any)?.droppedOn !== 'canvas'` check can be useful for
      // specific behaviors (e.g. reverting if not on a valid zone), but for our current
      // free-form placement, we proceed with the position update.
      
      const delta = monitor.getDifferenceFromInitialOffset(); // Delta in viewport coordinates
      if (delta) {
        const newX = Math.round(item.originalX + delta.x);
        const newY = Math.round(item.originalY + delta.y);
        // Update element's x,y in the context, ensuring non-negative values
        updateElement(item.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
      }
    },
  });

  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card selection when starting resize
    setIsResizing(true);
    const currentWidth = cardRef.current?.offsetWidth || parseInt(element.width || '280', 10);
    setInitialWidth(currentWidth);
    setInitialMouseX(e.clientX);
    setSelectedElement(element); // Keep element selected during resize
  }, [element, setSelectedElement]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !cardRef.current) return;
      const dx = e.clientX - initialMouseX;
      let newWidth = initialWidth + dx;
      newWidth = Math.max(MIN_WIDTH, newWidth);
      // Update element width in context
      updateElement(element.id, { width: `${newWidth}px` });
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, initialMouseX, initialWidth, element.id, updateElement]);


  const renderElementPreview = () => {
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
                <input type="radio" name={element.name} value={opt.value} defaultChecked={element.defaultValue === opt.value} disabled className="form-radio h-4 w-4 accent-primary" />
                <Label htmlFor={opt.id || opt.value} className="text-sm">{opt.label}</Label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center mt-1 gap-2">
            <Checkbox id={element.id} defaultChecked={element.defaultValue} disabled />
            {/* The label for checkbox is part of element.label, not a separate prop here typically */}
            <Label htmlFor={element.id} className="text-sm">{element.label}</Label>
          </div>
        );
      case 'date':
        return <Input type="date" defaultValue={element.defaultValue} readOnly className="mt-1 bg-muted/30" />;
      case 'file':
        return <Input type="file" disabled className="mt-1 bg-muted/30" />;
      case 'table':
        const tableEl = element as TableFormElementType;
        const previewRows = Math.min(tableEl.rows, 3);
        const previewCols = Math.min(tableEl.cols, 3);
        return (
          <div className="mt-1 overflow-auto">
            <table className="w-full border-collapse border border-border text-xs">
              <tbody>
                {Array.from({ length: previewRows }).map((_, rIndex) => (
                  <tr key={rIndex} className="border-b border-border">
                    {Array.from({ length: previewCols }).map((_, cIndex) => (
                      <td key={cIndex} className={`border-border p-1 h-5 text-muted-foreground ${cIndex < previewCols -1 ? 'border-r' : ''}`}>
                        {/* Cell */}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {(tableEl.rows > 3 || tableEl.cols > 3) && <p className="text-xs text-muted-foreground mt-1 text-center">Preview limited to 3x3</p>}
             <p className="text-xs text-muted-foreground mt-1 text-center">({tableEl.rows} rows x {tableEl.cols} cols)</p>
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">Unsupported element type</p>;
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    removeElement(element.id);
    if (isSelected) {
      setSelectedElement(null);
    }
  };
  
  const elementStyle: React.CSSProperties = {
    width: element.width || '280px', // Default width if not specified
    opacity: isDragging ? 0.4 : 1,
    minWidth: `${MIN_WIDTH}px`,
    position: 'absolute', // Crucial for free-form placement
    left: `${element.x || 0}px`,
    top: `${element.y || 0}px`,
    zIndex: isDragging || isSelected ? 100 : 1, // Ensure dragged/selected elements are on top
  };

  return (
    <div ref={preview} style={elementStyle} onClick={onSelect} className={isDragging ? '!cursor-grabbing' : 'cursor-grab'}>
      <Card
        ref={cardRef}
        className={`h-full transition-all duration-150 ease-in-out shadow-md hover:shadow-lg relative group w-full 
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border'}
          ${isDragging ? 'border-dashed border-primary' : ''} 
        `}
      >
        <CardHeader 
            className="py-3 px-4 bg-muted/50 rounded-t-lg flex flex-row items-center justify-between cursor-move"
            ref={drag} // Apply drag to the CardHeader
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <GripVertical size={18} className="text-muted-foreground hover:text-foreground flex-shrink-0" />
            <CardTitle className="text-base font-medium text-foreground truncate" title={element.label}>
              {element.label || `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Field`}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleRemove}
            aria-label="Remove element"
          >
            <Trash2 size={16} />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {(element.type !== 'checkbox' && element.type !== 'table') && element.placeholder && (
             <p className="text-xs text-muted-foreground mb-1">Placeholder: {element.placeholder}</p>
          )}
          {renderElementPreview()}
        </CardContent>
         {isSelected && (
          <div
            ref={resizeHandleRef}
            onMouseDown={handleResizeMouseDown}
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full cursor-se-resize border-2 border-background shadow"
            title="Resize element"
            style={{ zIndex: 101 }} // Ensure handle is above other elements but respects card content
          />
        )}
      </Card>
    </div>
  );
}

