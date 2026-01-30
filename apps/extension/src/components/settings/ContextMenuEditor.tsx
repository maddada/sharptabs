import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Minus } from "lucide-react";
import React from "react";
import { Switch } from "../ui/switch";

export type ContextMenuEditorItem = {
    id: string;
    type: "item" | "separator";
    label?: string;
    visible: boolean;
};

interface ContextMenuEditorProps {
    items: ContextMenuEditorItem[];
    onChange: (items: ContextMenuEditorItem[]) => void;
    title: string;
}

function SortableItem({
    item,
    listeners,
    attributes,
    isDragging,
    onToggleVisible,
}: {
    item: ContextMenuEditorItem;
    listeners: any;
    attributes: any;
    isDragging: boolean;
    onToggleVisible: () => void;
}) {
    return (
        <div
            className={`flex items-center gap-3 px-2 py-2 rounded bg-white dark:bg-muted/60 border mb-1 ${isDragging ? "opacity-60" : ""}`}
            style={{ cursor: "grab" }}
        >
            <span {...listeners} {...attributes} className="cursor-grab text-muted-foreground">
                <GripVertical className="h-4 w-4" />
            </span>
            {item.type === "separator" ? (
                <span className="flex items-center gap-2 italic text-muted-foreground">
                    <Minus className="h-4 w-4" /> Separator
                </span>
            ) : (
                <span>{item.label}</span>
            )}
            <div className="ml-auto flex items-center gap-2">
                <Switch checked={item.visible} onCheckedChange={onToggleVisible} />
                {item.visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
            </div>
        </div>
    );
}

export const ContextMenuEditor: React.FC<ContextMenuEditorProps> = ({ items, onChange, title }) => {
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            onChange(arrayMove(items, oldIndex, newIndex));
        }
    };

    return (
        <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableRow
                            key={item.id}
                            item={item}
                            onToggleVisible={() => {
                                onChange(items.map((i) => (i.id === item.id ? { ...i, visible: !i.visible } : i)));
                            }}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

function SortableRow({ item, onToggleVisible }: { item: ContextMenuEditorItem; onToggleVisible: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style}>
            <SortableItem item={item} listeners={listeners} attributes={attributes} isDragging={isDragging} onToggleVisible={onToggleVisible} />
        </div>
    );
}
