
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
        if (!monitor.isOver({ shallow: true })) {
            return;
        }

        const clientOffset = monitor.getClientOffset();

        if (!item.id && clientOffset && dropZoneRef.current) { 
          const canvasRect = dropZoneRef.current.getBoundingClientRect();
          const scrollLeft = dropZoneRef.current.scrollLeft;
          const scrollTop = dropZoneRef.current.scrollTop;

          let x = clientOffset.x - canvasRect.left + scrollLeft;
          let y = clientOffset.y - canvasRect.top + scrollTop;
          
          x = Math.max(0, Math.round(x));
          y = Math.max(0, Math.round(y));
          
          const newEl = addElement(item.type, { x, y });
          setSelectedElement(newEl);
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
