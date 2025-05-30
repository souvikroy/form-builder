
"use client";
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import type { ElementType, FormElement as FormElementType } from '@/lib/types';
import { ItemTypes } from './DraggableItem';
import CanvasElement from './CanvasElement';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DropItem {
  type: ElementType;
  id?: string; // id is present if dragging an existing element
}

export default function Canvas() {
  const { formDefinition, addElement, setSelectedElement, selectedElement } = useFormBuilder();
  const dropZoneRef = useRef<HTMLDivElement>(null); 

  const [{ isOver, canDrop }, dropCollect] = useDrop(
    () => ({
      accept: ItemTypes.FORM_ELEMENT,
      drop: (item: DropItem, monitor) => {
        if (!monitor.isOver({ shallow: true })) { // Ensure drop is directly on canvas, not child
            return;
        }

        const clientOffset = monitor.getClientOffset(); // Mouse position relative to viewport

        // This handles dropping NEW elements from the sidebar onto the canvas
        if (!item.id && clientOffset && dropZoneRef.current) { 
          const canvasContentRect = dropZoneRef.current.getBoundingClientRect(); // Rect of the large content div relative to viewport
          const scrollingViewport = dropZoneRef.current.parentElement?.parentElement; // This should be the ScrollArea's Viewport element

          if (scrollingViewport) {
            const scrollLeft = scrollingViewport.scrollLeft;
            const scrollTop = scrollingViewport.scrollTop;
            
            let x = clientOffset.x - canvasContentRect.left + scrollLeft;
            let y = clientOffset.y - canvasContentRect.top + scrollTop;
            
            // Ensure coordinates are non-negative and round them
            x = Math.max(0, Math.round(x));
            y = Math.max(0, Math.round(y));
            
            const newEl = addElement(item.type, { x, y });
            setSelectedElement(newEl);
          }
        }
        // If item.id exists, it means an existing CanvasElement is being dragged.
        // Its position update is handled by its own useDrag's end() method in CanvasElement.tsx
        return { droppedOn: 'canvas' }; // Signifies the drop target
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true }),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [addElement, setSelectedElement]
  );

  dropCollect(dropZoneRef); // Apply the drop target to the ref

  const handleSelectElement = (element: FormElementType) => {
    setSelectedElement(element);
  };

  return (
    <ScrollArea className="h-full bg-background">
      <div
        ref={dropZoneRef} 
        className={`transition-colors duration-200 ${
          isOver && canDrop ? 'bg-primary/10' : 'bg-muted/20'
        } ${formDefinition.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}
        style={{ 
            position: 'relative', // Crucial for absolute positioning of children
            minWidth: '2500px', 
            minHeight: '1800px', 
            padding: '32px', // Equivalent to p-8
        }} 
      >
        {formDefinition.length === 0 ? (
          <div className="text-center text-muted-foreground p-10 border-2 border-dashed border-border rounded-lg">
            <p className="text-lg font-medium">Drag and drop elements here</p>
            <p className="text-sm">Build your form by adding elements from the left panel.</p>
          </div>
        ) : (
          formDefinition.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedElement?.id === element.id}
              onSelect={() => handleSelectElement(element)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
