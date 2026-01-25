'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Pencil, Trash2, Plus, EyeOff, GripVertical } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteCategory, reorderCategories } from '@/app/lib/actions';
import type { CategoryWithChildren } from '@/app/lib/definitions';
import { cn } from '@/app/lib/utils';

interface CategoryTreeProps {
  categories: CategoryWithChildren[];
}

export default function CategoryTree({ categories: initialCategories }: CategoryTreeProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categoryIds = useMemo(() => categories.map(c => c.id), [categories]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      // Save new order
      setIsSaving(true);
      const orderedIds = newCategories.map((c, index) => ({
        id: c.id,
        sortOrder: index,
      }));
      await reorderCategories(orderedIds);
      setIsSaving(false);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">No categories yet.</p>
        <Link
          href="/admin/categories/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create First Category
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {isSaving && (
        <div className="text-xs text-gray-500 mb-2">Saving order...</div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
          {categories.map((category) => (
            <SortableCategoryNode key={category.id} category={category} depth={0} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SortableCategoryNodeProps {
  category: CategoryWithChildren;
  depth: number;
}

function SortableCategoryNode({ category, depth }: SortableCategoryNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryNode
        category={category}
        depth={depth}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

interface CategoryNodeProps {
  category: CategoryWithChildren;
  depth: number;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

function CategoryNode({ category, depth, dragHandleProps, isDragging }: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [childCategories, setChildCategories] = useState(category.children);
  const [isSavingChildren, setIsSavingChildren] = useState(false);
  const hasChildren = childCategories.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const childIds = useMemo(() => childCategories.map(c => c.id), [childCategories]);

  async function handleChildDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = childCategories.findIndex((c) => c.id === active.id);
      const newIndex = childCategories.findIndex((c) => c.id === over.id);

      const newChildren = arrayMove(childCategories, oldIndex, newIndex);
      setChildCategories(newChildren);

      // Save new order
      setIsSavingChildren(true);
      const orderedIds = newChildren.map((c, index) => ({
        id: c.id,
        sortOrder: index,
      }));
      await reorderCategories(orderedIds);
      setIsSavingChildren(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    
    const result = await deleteCategory(category.id);
    
    if (!result.success) {
      setDeleteError(result.message);
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 group',
          !category.isVisible && 'opacity-60',
          isDragging && 'bg-blue-50 shadow-lg ring-2 ring-blue-200'
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="size-6 flex items-center justify-center rounded hover:bg-gray-200 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>

        {/* Expand/Collapse button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'size-6 flex items-center justify-center rounded hover:bg-gray-200',
            !hasChildren && 'invisible'
          )}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {/* Category info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{category.name}</span>
            <span className="text-xs text-gray-400 font-mono">/{category.slugPath}</span>
            {!category.isVisible && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <EyeOff className="size-3" />
                Hidden
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-gray-500 truncate">{category.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/admin/categories/create?parent=${category.id}`}
            className="p-2 rounded hover:bg-gray-200"
            title="Add subcategory"
            aria-label={`Add subcategory to ${category.name}`}
          >
            <Plus className="size-4" />
          </Link>
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="p-2 rounded hover:bg-gray-200"
            title="Edit category"
            aria-label={`Edit ${category.name}`}
          >
            <Pencil className="size-4" />
          </Link>
          
          <AlertDialog.Root>
            <AlertDialog.Trigger asChild>
              <button
                type="button"
                className="p-2 rounded hover:bg-red-100 text-red-600"
                title="Delete category"
                aria-label={`Delete ${category.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 shadow-xl">
                <AlertDialog.Title className="text-lg font-semibold">
                  Delete Category
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-2 text-gray-600">
                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                </AlertDialog.Description>
                
                {deleteError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {deleteError}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end gap-3">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </div>

      {/* Children - also sortable */}
      {hasChildren && isExpanded && (
        <div>
          {isSavingChildren && (
            <div className="text-xs text-gray-500 ml-12 mb-1">Saving...</div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleChildDragEnd}
          >
            <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
              {childCategories.map((child) => (
                <SortableChildNode key={child.id} category={child} depth={depth + 1} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function SortableChildNode({ category, depth }: { category: CategoryWithChildren; depth: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryNode
        category={category}
        depth={depth}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}
