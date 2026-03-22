import type { LeafInfo, LeafMapping, MappingResult } from '../types.ts';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function extractLeaves(
  obj: Record<string, JsonValue>,
  currentPath: string[] = [],
): LeafInfo[] {
  const leaves: LeafInfo[] = [];

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const path = [...currentPath, key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      leaves.push(...extractLeaves(value as Record<string, JsonValue>, path));
    } else {
      leaves.push({ path, leafKey: key, defaultValue: value });
    }
  }

  return leaves;
}

export function computeMapping(
  template: Record<string, unknown>,
  csvHeaders: string[],
): MappingResult {
  const leaves = extractLeaves(template as Record<string, JsonValue>);
  const warnings: string[] = [];

  const leafKeyCount = new Map<string, number>();
  for (const leaf of leaves) {
    leafKeyCount.set(leaf.leafKey, (leafKeyCount.get(leaf.leafKey) ?? 0) + 1);
  }
  for (const [key, count] of leafKeyCount) {
    if (count > 1) {
      warnings.push(
        `Duplicate leaf name "${key}" appears ${count} times — all instances will use the same CSV column`,
      );
    }
  }

  const headerIndexMap = new Map<string, number>();
  for (let i = 0; i < csvHeaders.length; i++) {
    headerIndexMap.set(csvHeaders[i], i);
  }

  const matchedColumnIndices = new Set<number>();
  const mappedLeaves: LeafMapping[] = leaves.map((leaf) => {
    const idx = headerIndexMap.get(leaf.leafKey) ?? null;
    if (idx !== null) matchedColumnIndices.add(idx);
    return {
      path: leaf.path,
      leafKey: leaf.leafKey,
      csvColumnIndex: idx,
      defaultValue: leaf.defaultValue,
    };
  });

  const ignoredColumns = csvHeaders.filter((_, i) => !matchedColumnIndices.has(i));

  return { leaves: mappedLeaves, warnings, ignoredColumns };
}

function setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in current) || typeof current[path[i]] !== 'object' || current[path[i]] === null) {
      current[path[i]] = {};
    }
    current = current[path[i]] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function mapRows(
  template: Record<string, unknown>,
  mapping: MappingResult,
  rows: string[][],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const result = deepClone(template);

    for (const leaf of mapping.leaves) {
      if (leaf.csvColumnIndex !== null) {
        const value = row[leaf.csvColumnIndex] ?? '';
        setNestedValue(result, leaf.path, value);
      }
    }

    return result;
  });
}
