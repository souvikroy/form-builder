
"use client";
import React from 'react';
import { useDrop } from 'react-dnd';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import type { ElementType, FormElement as FormElementType } from '@/lib/types';
import { ItemTypes } from './DraggableItem';
import CanvasElement from './CanvasElement';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DropItem {
  type: ElementType;
}

export default function Canvas() {
  const { formDefinition, addElement, moveElement, setSelectedElement, selectedElement } = useFormBuilder();

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.FORM_ELEMENT,
    drop: (item: DropItem, monitor) => {
      if (!monitor.didDrop()) { 
         const newEl = addElement(item.type); 
         setSelectedElement(newEl);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const handleSelectElement = (element: FormElementType) => {
    setSelectedElement(element);
  };

  return (
    <ScrollArea className="h-full bg-background" ref={drop}>
      <div
        className={`min-h-full p-8 transition-colors duration-200 ${
          isOver && canDrop ? 'bg-primary/10' : 'bg-muted/20'
        } ${formDefinition.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}
        style={{ minHeight: 'calc(100vh - 4rem)' }} 
      >
        {formDefinition.length === 0 ? (
          <div className="text-center text-muted-foreground p-10 border-2 border-dashed border-border rounded-lg">
            <p className="text-lg font-medium">Drag and drop elements here</p>
            <p className="text-sm">Build your form by adding elements from the left panel.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 items-start"> {/* items-start for better alignment if heights differ */}
            {formDefinition.map((element, index) => (
              <div key={element.id} className="flex-shrink-0"> {/* Element itself controls its width */}
                <CanvasElement
                  element={element}
                  index={index}
                  isSelected={selectedElement?.id === element.id}
                  onSelect={() => handleSelectElement(element)}
                  moveElement={moveElement}
                />
              </div>
            ))}
          </div>
        )}
        {formDefinition.length > 0 && (
          <div className={`h-10 w-full rounded-md mt-4 ${isOver && canDrop ? 'bg-primary/20 border-2 border-dashed border-primary' : ''}`}
            aria-hidden="true"
          />
        )}
      </div>
    </ScrollArea>
  );
}
