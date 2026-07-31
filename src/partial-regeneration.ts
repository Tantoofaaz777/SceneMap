import { humanizeTrackerKey } from "./shared";

export type TrackerPathSegment = string | number;

export interface RegeneratableField {
  path: TrackerPathSegment[];
  label: string;
  groups: string[];
  currentValue: unknown;
}

const forbiddenPathSegments = new Set(["__proto__", "prototype", "constructor"]);
const MAX_SELECTED_FIELDS = 50;
const MAX_PATH_DEPTH = 16;

/**
 * Presents scalar values and primitive arrays as independently regeneratable
 * leaves. Arrays of objects are expanded by item so character fields can be
 * selected without replacing the character or array around them.
 */
export function collectRegeneratableFields(value: unknown): RegeneratableField[] {
  const fields: RegeneratableField[] = [];
  collectFields(value, [], [], "", fields);
  return fields;
}

export function normalizeTrackerPaths(value: unknown): TrackerPathSegment[][] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Select at least one tracker field to regenerate.");
  }
  if (value.length > MAX_SELECTED_FIELDS) {
    throw new Error(`You can regenerate at most ${MAX_SELECTED_FIELDS} fields at once.`);
  }

  const paths = value.map((candidate, pathIndex) => {
    if (!Array.isArray(candidate) || candidate.length === 0 || candidate.length > MAX_PATH_DEPTH) {
      throw new Error(`Selected tracker field ${pathIndex + 1} has an invalid path.`);
    }
    return candidate.map((segment) => {
      if (typeof segment === "number") {
        if (!Number.isSafeInteger(segment) || segment < 0) {
          throw new Error("Tracker array indexes must be non-negative integers.");
        }
        return segment;
      }
      if (
        typeof segment !== "string"
        || segment.length === 0
        || segment.length > 128
        || forbiddenPathSegments.has(segment)
      ) {
        throw new Error("A selected tracker field contains an unsafe path segment.");
      }
      return segment;
    });
  });

  const keys = new Set<string>();
  for (const path of paths) {
    const key = trackerPathKey(path);
    if (keys.has(key)) throw new Error("The same tracker field was selected more than once.");
    keys.add(key);
  }
  for (let left = 0; left < paths.length; left += 1) {
    for (let right = left + 1; right < paths.length; right += 1) {
      if (isPathPrefix(paths[left], paths[right]) || isPathPrefix(paths[right], paths[left])) {
        throw new Error("Select either a tracker field or one of its children, not both.");
      }
    }
  }
  return paths;
}

export function trackerPathKey(path: TrackerPathSegment[]): string {
  return JSON.stringify(path);
}

export function formatTrackerPath(path: TrackerPathSegment[], tracker: unknown): string {
  const labels: string[] = [];
  let current = tracker;
  for (const segment of path) {
    if (typeof segment === "number") {
      const record = getRecord(Array.isArray(current) ? current[segment] : null);
      const name = compactLabel(record?.name);
      labels.push(name || `Item ${segment + 1}`);
      current = Array.isArray(current) ? current[segment] : undefined;
      continue;
    }
    labels.push(humanizeTrackerKey(segment));
    current = getChild(current, segment);
  }
  return labels.join(" \u203a ");
}

export function getTrackerValueAtPath(value: unknown, path: TrackerPathSegment[]): unknown {
  let current = value;
  for (const segment of path) {
    if (!hasChild(current, segment)) {
      throw new Error(`Tracker field "${formatTrackerPath(path, value)}" no longer exists.`);
    }
    current = getChild(current, segment);
  }
  return current;
}

export function applyTrackerFieldUpdates(
  tracker: unknown,
  updates: Array<{ path: TrackerPathSegment[]; value: unknown }>,
): object {
  if (!getRecord(tracker)) throw new Error("The existing tracker must be a JSON object.");
  const clone = cloneJsonValue(tracker);
  for (const update of updates) setExistingTrackerValue(clone, update.path, cloneJsonValue(update.value));
  return clone as object;
}

/**
 * Finds the schema applying at a concrete data path. Local references and
 * compositions are materialized so the result remains valid when embedded in
 * the temporary response schema sent to the model.
 */
export function getTrackerSubschema(
  rootSchema: Record<string, unknown>,
  path: TrackerPathSegment[],
): unknown | null {
  let schema: unknown = rootSchema;
  for (const segment of path) {
    schema = deriveChildSchema(schema, segment, rootSchema, new Set());
    if (schema === null) return null;
  }
  return materializeSchema(schema, rootSchema, new Set());
}

function collectFields(
  value: unknown,
  path: TrackerPathSegment[],
  groups: string[],
  label: string,
  fields: RegeneratableField[],
): void {
  const record = getRecord(value);
  if (record && Object.keys(record).length > 0) {
    const nextGroups = label ? [...groups, label] : groups;
    for (const [key, child] of Object.entries(record)) {
      collectFields(child, [...path, key], nextGroups, humanizeTrackerKey(key), fields);
    }
    return;
  }

  if (Array.isArray(value) && value.length > 0 && value.every((item) => getRecord(item) !== null)) {
    const nextGroups = label ? [...groups, label] : groups;
    value.forEach((item, index) => {
      const name = compactLabel(getRecord(item)?.name) || `Item ${index + 1}`;
      collectFields(item, [...path, index], [...nextGroups, name], "", fields);
    });
    return;
  }

  // The root itself is handled by "Entire tracker"; it is never a selectable leaf.
  if (path.length === 0) return;
  fields.push({
    path,
    label: label || humanizeTrackerKey(String(path.at(-1) ?? "Field")),
    groups,
    currentValue: value,
  });
}

function deriveChildSchema(
  schema: unknown,
  segment: TrackerPathSegment,
  rootSchema: Record<string, unknown>,
  seenRefs: Set<string>,
): unknown | null {
  if (schema === true) return {};
  if (schema === false || !getRecord(schema)) return null;
  const record = schema as Record<string, unknown>;
  const candidates: unknown[] = [];

  if (typeof record.$ref === "string" && record.$ref.startsWith("#/") && !seenRefs.has(record.$ref)) {
    const resolved = resolveLocalSchemaRef(rootSchema, record.$ref);
    if (resolved !== null) {
      candidates.push(deriveChildSchema(
        resolved,
        segment,
        rootSchema,
        new Set([...seenRefs, record.$ref]),
      ));
    }
  }

  if (typeof segment === "string") {
    const properties = getRecord(record.properties);
    if (properties && Object.prototype.hasOwnProperty.call(properties, segment)) {
      candidates.push(properties[segment]);
    } else if (getRecord(record.additionalProperties)) {
      candidates.push(record.additionalProperties);
    } else if (record.additionalProperties === true) {
      candidates.push({});
    }
  } else if (Array.isArray(record.items)) {
    if (record.items[segment] !== undefined) candidates.push(record.items[segment]);
    else if (record.additionalItems !== false) candidates.push(record.additionalItems === undefined ? {} : record.additionalItems);
  } else if (record.items !== undefined) {
    candidates.push(record.items);
  } else if (Array.isArray(record.prefixItems)) {
    if (record.prefixItems[segment] !== undefined) candidates.push(record.prefixItems[segment]);
    else if (record.items !== false) candidates.push(record.items === undefined ? {} : record.items);
  }

  for (const keyword of ["allOf", "anyOf", "oneOf"] as const) {
    if (!Array.isArray(record[keyword])) continue;
    const children = record[keyword]
      .map((child) => deriveChildSchema(child, segment, rootSchema, new Set(seenRefs)))
      .filter((child): child is unknown => child !== null);
    if (children.length === 1) candidates.push(children[0]);
    else if (children.length > 1) candidates.push({ [keyword]: children });
  }

  const valid = candidates.filter((candidate) => candidate !== null);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];
  return { allOf: valid };
}

function materializeSchema(
  schema: unknown,
  rootSchema: Record<string, unknown>,
  seenRefs: Set<string>,
): unknown {
  if (typeof schema === "boolean" || !schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map((item) => materializeSchema(item, rootSchema, seenRefs));
  const record = schema as Record<string, unknown>;
  if (typeof record.$ref === "string" && record.$ref.startsWith("#/")) {
    if (seenRefs.has(record.$ref)) return {};
    const resolved = resolveLocalSchemaRef(rootSchema, record.$ref);
    if (resolved !== null) {
      const resolvedSchema = materializeSchema(resolved, rootSchema, new Set([...seenRefs, record.$ref]));
      const siblings = Object.fromEntries(
        Object.entries(record)
          .filter(([key]) => key !== "$ref")
          .map(([key, child]) => [key, materializeSchema(child, rootSchema, seenRefs)]),
      );
      return Object.keys(siblings).length > 0 ? { allOf: [resolvedSchema, siblings] } : resolvedSchema;
    }
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, child]) => [key, materializeSchema(child, rootSchema, seenRefs)]),
  );
}

function resolveLocalSchemaRef(rootSchema: Record<string, unknown>, reference: string): unknown | null {
  let current: unknown = rootSchema;
  for (const token of reference.slice(2).split("/")) {
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    if (!Object.prototype.hasOwnProperty.call(current, key)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setExistingTrackerValue(root: unknown, path: TrackerPathSegment[], nextValue: unknown): void {
  if (path.length === 0) throw new Error("A partial update cannot replace the entire tracker.");
  let parent = root;
  for (const segment of path.slice(0, -1)) {
    if (!hasChild(parent, segment)) throw new Error("A selected tracker field no longer exists.");
    parent = getChild(parent, segment);
  }
  const last = path[path.length - 1];
  if (!hasChild(parent, last)) throw new Error("A selected tracker field no longer exists.");
  if (Array.isArray(parent) && typeof last === "number") parent[last] = nextValue;
  else (parent as Record<string, unknown>)[last as string] = nextValue;
}

function hasChild(parent: unknown, segment: TrackerPathSegment): boolean {
  if (Array.isArray(parent)) {
    return typeof segment === "number" && segment < parent.length;
  }
  return typeof segment === "string"
    && getRecord(parent) !== null
    && Object.prototype.hasOwnProperty.call(parent, segment);
}

function getChild(parent: unknown, segment: TrackerPathSegment): unknown {
  if (Array.isArray(parent) && typeof segment === "number") return parent[segment];
  if (typeof segment === "string" && getRecord(parent)) return (parent as Record<string, unknown>)[segment];
  return undefined;
}

function cloneJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  const record = getRecord(value);
  if (record) {
    return Object.fromEntries(Object.entries(record).map(([key, child]) => [key, cloneJsonValue(child)]));
  }
  return value;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function compactLabel(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isPathPrefix(left: TrackerPathSegment[], right: TrackerPathSegment[]): boolean {
  return left.length < right.length && left.every((segment, index) => segment === right[index]);
}
