import type { Category, CategoryWithChildren, LeafCategory } from './definitions';

/**
 * Build a tree structure from a flat list of categories
 */
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  // First pass: create map entries with empty children
  for (const cat of categories) {
    categoryMap.set(cat.id, { ...cat, children: [] });
  }

  // Second pass: build parent-child relationships
  for (const cat of categories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  // Sort children by sortOrder
  const sortChildren = (nodes: CategoryWithChildren[]): void => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  sortChildren(roots);

  return roots;
}

/**
 * Flatten a category tree into a list with full path labels
 * Useful for select dropdowns
 */
export function flattenCategoryTree(
  tree: CategoryWithChildren[],
  parentPath = ''
): LeafCategory[] {
  const result: LeafCategory[] = [];

  for (const node of tree) {
    const fullPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    
    result.push({
      id: node.id,
      name: node.name,
      slugPath: node.slugPath,
      fullPath,
    });

    if (node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, fullPath));
    }
  }

  return result;
}

/**
 * Get only leaf categories (categories with no children)
 */
export function getLeafCategories(tree: CategoryWithChildren[]): LeafCategory[] {
  const result: LeafCategory[] = [];

  const traverse = (nodes: CategoryWithChildren[], parentPath = ''): void => {
    for (const node of nodes) {
      const fullPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
      
      if (node.children.length === 0) {
        result.push({
          id: node.id,
          name: node.name,
          slugPath: node.slugPath,
          fullPath,
        });
      } else {
        traverse(node.children, fullPath);
      }
    }
  };

  traverse(tree);
  return result;
}

/**
 * Find a category by slugPath in a tree
 */
export function findCategoryByPath(
  tree: CategoryWithChildren[],
  slugPath: string
): CategoryWithChildren | null {
  for (const node of tree) {
    if (node.slugPath === slugPath) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findCategoryByPath(node.children, slugPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all descendant category IDs (including the category itself)
 */
export function getDescendantIds(node: CategoryWithChildren): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...getDescendantIds(child));
  }
  return ids;
}

/**
 * Build breadcrumb path from slugPath
 */
export function buildBreadcrumbFromPath(
  tree: CategoryWithChildren[],
  slugPath: string
): CategoryWithChildren[] {
  const segments = slugPath.split('/');
  const breadcrumb: CategoryWithChildren[] = [];
  let currentLevel = tree;
  let currentPath = '';

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    const found = currentLevel.find(c => c.slugPath === currentPath);
    if (found) {
      breadcrumb.push(found);
      currentLevel = found.children;
    } else {
      break;
    }
  }

  return breadcrumb;
}
