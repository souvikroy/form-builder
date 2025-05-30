
"use client";
import React, { useRef } from 'react'; // Added useRef
import { useDrop } from 'react-dnd';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import type { ElementType, FormElement as FormElementType } from '@/lib/types';
import { ItemTypes } from './DraggableItem';
import CanvasElement from './CanvasElement';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DropItem {
  type: ElementType;
  id?: string; // id is present if dragging an existing element
  // index and originalX/Y might be on item if passed from CanvasElement's drag source
}

export default function Canvas() {
  const { formDefinition, addElement, setSelectedElement, selectedElement } = useFormBuilder();
  const dropZoneRef = useRef<HTMLDivElement>(null); // Ref for the actual drop zone div

  const [{ isOver, canDrop }, dropCollect] = useDrop(
    () => ({
      accept: ItemTypes.FORM_ELEMENT,
      drop: (item: DropItem, monitor) => {
        // Only handle drops directly on the canvas, not on child elements that might also be drop targets
        // For new elements from sidebar, or existing elements moved *onto the canvas background*
        if (!monitor.isOver({ shallow: true })) {
            return;
        }

        const clientOffset = monitor.getClientOffset();

        if (!item.id && clientOffset && dropZoneRef.current) { // New element from sidebar (item.id is undefined)
          const canvasRect = dropZoneRef.current.getBoundingClientRect();
          const scrollLeft = dropZoneRef.current.scrollLeft;
          const scrollTop = dropZoneRef.current.scrollTop;

          // Calculate drop position relative to the scrollable content of dropZoneRef
          let x = clientOffset.x - canvasRect.left + scrollLeft;
          let y = clientOffset.y - canvasRect.top + scrollTop;
          
          // Adjust for padding if needed, assuming p-8 means roughly 32px.
          // This makes the top-left of the dropped item align more with cursor.
          // No, this adjustment is not needed if x,y is relative to the padded container.
          // x -= 0; 
          // y -= 0;

          x = Math.max(0, Math.round(x));
          y = Math.max(0, Math.round(y));
          
          const newEl = addElement(item.type, { x, y });
          setSelectedElement(newEl);
        }
        // For existing elements, their position is updated by their own useDrag().end handler in CanvasElement.tsx
        // So, no specific action needed here for item.id existing.

        return { droppedOn: 'canvas' }; // Signify that drop occurred on canvas
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true }),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [addElement, setSelectedElement]
  );

  // Connect the drop collector to the actual drop zone ref
  dropCollect(dropZoneRef);

  const handleSelectElement = (element: FormElementType) => {
    setSelectedElement(element);
  };

  return (
    <ScrollArea className="h-full bg-background">
      <div
        ref={dropZoneRef} // This div is the actual drop target and relative positioning context
        className={`min-h-full p-8 transition-colors duration-200 ${
          isOver && canDrop ? 'bg-primary/10' : 'bg-muted/20'
        } ${formDefinition.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}
        style={{ 
            position: 'relative', // Essential for absolute positioning of children
            minHeight: 'calc(100vh - 4rem)' 
        }} 
      >
        {formDefinition.length === 0 ? (
          <div className="text-center text-muted-foreground p-10 border-2 border-dashed border-border rounded-lg">
            <p className="text-lg font-medium">Drag and drop elements here</p>
            <p className="text-sm">Build your form by adding elements from the left panel.</p>
          </div>
        ) : (
          // Elements are mapped directly; they will position themselves absolutely
          formDefinition.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              isSelected={selectedElement?.id === element.id}
              onSelect={() => handleSelectElement(element)}
              // moveElement prop removed
            />
          ))
        )}
        {/* The placeholder drop zone at the bottom is removed as it's not suitable for 2D free-form layout */}
      </div>
    </ScrollArea>
  );
}
