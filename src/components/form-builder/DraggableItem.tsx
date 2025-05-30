
"use client";
import React from 'react';
import { useDrag } from 'react-dnd';
import type { ElementType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';

interface DraggableItemProps {
  type: ElementType;
  label: string;
  icon: React.ElementType;
}

export const ItemTypes = {
  FORM_ELEMENT: 'formElement',
};

export default function DraggableItem({ type, label, icon: Icon }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FORM_ELEMENT,
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Card
      ref={drag}
      className={`p-3 flex items-center gap-3 cursor-grab rounded-md border border-border shadow-sm hover:shadow-md transition-shadow bg-background hover:bg-muted ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
      aria-label={`Drag to add ${label}`}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Card>
  );
}
