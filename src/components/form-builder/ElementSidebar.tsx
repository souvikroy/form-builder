
"use client";
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ElementType } from '@/lib/types';
import DraggableItem from './DraggableItem';
import {
  Type,
  Hash,
  Mail,
  FileText,
  ChevronDownSquare,
  CircleDot,
  CheckSquare,
  CalendarDays,
  FileUp,
} from 'lucide-react';

const formElements: { type: ElementType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'number', label: 'Number Input', icon: Hash },
  { type: 'email', label: 'Email Input', icon: Mail },
  { type: 'textarea', label: 'Text Area', icon: FileText },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDownSquare },
  { type: 'radio', label: 'Radio Group', icon: CircleDot },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'date', label: 'Date Picker', icon: CalendarDays },
  { type: 'file', label: 'File Upload', icon: FileUp },
];

export default function ElementSidebar() {
  return (
    <aside className="w-72 border-r border-border bg-card p-4 flex flex-col shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Form Elements</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-3">
          {formElements.map((element) => (
            <DraggableItem key={element.type} type={element.type} label={element.label} icon={element.icon} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
