
"use client";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import type { FormElement, TableFormElement as TableFormElementType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, CardTitle
// import { Button } from '@/components/ui/button'; // Button no longer needed here
// import { GripVertical, Trash2 } from 'lucide-react'; // Icons no longer needed here
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
  gridSnapSize: number;
}

interface DragItem {
  id: string;
  type: string;
  originalX: number;
  originalY: number;
}

const MIN_WIDTH = 100;

export default function CanvasElement({ element, isSelected, onSelect, gridSnapSize }: CanvasElementProps) {
  const { updateElement, setSelectedElement } = useFormBuilder(); // removeElement removed as button is gone
  const cardRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialMouseX, setInitialMouseX] = useState(0);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.FORM_ELEMENT,
      item: (): DragItem => ({
        id: element.id,
        type: ItemTypes.FORM_ELEMENT,
        originalX: element.x || 0,
        originalY: element.y || 0,
      }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (delta) {
          let newX = Math.round(item.originalX + delta.x);
          let newY = Math.round(item.originalY + delta.y);

          // Snap to grid
          newX = Math.round(newX / gridSnapSize) * gridSnapSize;
          newY = Math.round(newY / gridSnapSize) * gridSnapSize;

          updateElement(item.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
        }
      },
    }),
    [element.id, element.x, element.y, updateElement, gridSnapSize]
  );

  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const currentWidth = cardRef.current?.offsetWidth || parseInt(element.width || '280', 10);
    setInitialWidth(currentWidth);
    setInitialMouseX(e.clientX);
    setSelectedElement(element);
  }, [element, setSelectedElement]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !cardRef.current) return;
      const dx = e.clientX - initialMouseX;
      let newWidth = initialWidth + dx;
      newWidth = Math.max(MIN_WIDTH, newWidth);
      // Snap width to grid
      newWidth = Math.round(newWidth / gridSnapSize) * gridSnapSize;
      newWidth = Math.max(MIN_WIDTH, newWidth); // Ensure min width after snapping

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
  }, [isResizing, initialMouseX, initialWidth, element.id, updateElement, gridSnapSize]);


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

  // Remove button is removed, so handleRemove function is no longer needed here.
  // const handleRemove = (e: React.MouseEvent) => { ... };

  const elementStyle: React.CSSProperties = {
    width: element.width || '280px',
    opacity: isDragging ? 0.4 : 1,
    minWidth: `${MIN_WIDTH}px`,
    position: 'absolute',
    left: `${element.x || 0}px`,
    top: `${element.y || 0}px`,
    zIndex: isDragging || isSelected ? 100 : 1,
  };

  // The entire element is now draggable. Assign `drag` ref to the root div.
  // Also, assign `preview` to the root div, as `CardHeader` is gone.
  const combinedRef = (node: HTMLDivElement | null) => {
    drag(node);
    preview(node);
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node; // Keep cardRef for resizing
  };

  return (
    <div 
        ref={combinedRef} 
        style={elementStyle} 
        onClick={onSelect} 
        className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'} relative group`} // Added relative and group for resize handle
    >
      <Card
        className={`h-full transition-all duration-150 ease-in-out shadow-md hover:shadow-lg w-full 
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border'}
          ${isDragging ? 'border-dashed border-primary' : ''}
        `}
      >
        {/* CardHeader removed */}
        <CardContent className="p-4">
          {/* Explicit placeholder preview text removed */}
          <p className="text-sm font-medium text-foreground mb-1 truncate" title={element.label}>
            {element.label || `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Field`}
          </p>
          {renderElementPreview()}
        </CardContent>
         {isSelected && (
          <div
            ref={resizeHandleRef}
            onMouseDown={handleResizeMouseDown}
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full cursor-se-resize border-2 border-background shadow"
            title="Resize element"
            style={{ zIndex: 101 }}
          />
        )}
      </Card>
    </div>
  );
}
