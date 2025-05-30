
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

const GRID_SNAP_SIZE = 20; // Pixels

export default function Canvas() {
  const { formDefinition, addElement, setSelectedElement, selectedElement } = useFormBuilder();
  const dropZoneRef = useRef<HTMLDivElement>(null); 

  const [{ isOver, canDrop }, dropCollect] = useDrop(
    () => ({
      accept: ItemTypes.FORM_ELEMENT,
      drop: (item: DropItem, monitor) => {
        if (!monitor.isOver({ shallow: true })) { 
            return;
        }

        const clientOffset = monitor.getClientOffset(); 

        if (!item.id && clientOffset && dropZoneRef.current) { 
          const canvasContentRect = dropZoneRef.current.getBoundingClientRect(); 
          const scrollingViewport = dropZoneRef.current.parentElement?.parentElement; 

          if (scrollingViewport) {
            const scrollLeft = scrollingViewport.scrollLeft;
            const scrollTop = scrollingViewport.scrollTop;
            
            let x = clientOffset.x - canvasContentRect.left + scrollLeft;
            let y = clientOffset.y - canvasContentRect.top + scrollTop;
            
            // Snap to grid
            x = Math.round(x / GRID_SNAP_SIZE) * GRID_SNAP_SIZE;
            y = Math.round(y / GRID_SNAP_SIZE) * GRID_SNAP_SIZE;
            
            x = Math.max(0, x);
            y = Math.max(0, y);
            
            const newEl = addElement(item.type, { x, y });
            setSelectedElement(newEl);
          }
        }
        return { droppedOn: 'canvas' };
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true }),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [addElement, setSelectedElement]
  );

  dropCollect(dropZoneRef);

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
            position: 'relative', 
            minWidth: '2500px', 
            minHeight: '1800px', 
            padding: '32px', 
            backgroundImage: `radial-gradient(circle, hsl(var(--border)) 0.5px, transparent 0.5px)`,
            backgroundSize: `${GRID_SNAP_SIZE}px ${GRID_SNAP_SIZE}px`,
        }} 
      >
        {formDefinition.length === 0 ? (
          <div className="text-center text-muted-foreground p-10 border-2 border-dashed border-border rounded-lg bg-background/80">
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
              gridSnapSize={GRID_SNAP_SIZE}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
