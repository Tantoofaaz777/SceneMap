export type TrackerEditPath = Array<string | number>;

export type TrackerEditControlKind =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "enum"
  | "string_array"
  | "number_array"
  | "integer_array";

const blockedPathKeys = new Set(["__proto__", "prototype", "constructor"]);

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function decodeRefToken(token: string): string {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function resolveLocalRef(rootSchema: Record<string, unknown>, ref: string): unknown {
  if (!ref.startsWith("#/")) return null;
  let current: unknown = rootSchema;
  for (const token of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return null;
    current = (current as Record<string, unknown>)[decodeRefToken(token)];
  }
  return current;
}

function mergeSchemas(left: Record<string, unknown>, right: Record<string, unknown>): Record<string, unknown> {
  const leftProperties = getRecord(left.properties);
  const rightProperties = getRecord(right.properties);
  return {
    ...left,
    ...right,
    ...(Object.keys(leftProperties).length || Object.keys(rightProperties).length
      ? { properties: { ...leftProperties, ...rightProperties } }
      : {}),
  };
}

function normalizeSchema(
  schema: unknown,
  rootSchema: Record<string, unknown>,
  seenRefs = new Set<string>(),
): Record<string, unknown> {
  const source = getRecord(schema);
  let normalized = { ...source };
  const ref = typeof source.$ref === "string" ? source.$ref : null;
  if (ref?.startsWith("#/") && !seenRefs.has(ref)) {
    const resolved = resolveLocalRef(rootSchema, ref);
    if (resolved) {
      const nextRefs = new Set(seenRefs).add(ref);
      normalized = mergeSchemas(normalizeSchema(resolved, rootSchema, nextRefs), normalized);
    }
  }
  for (const keyword of ["allOf", "oneOf", "anyOf"] as const) {
    const variants = source[keyword];
    if (!Array.isArray(variants)) continue;
    for (const variant of variants) {
      normalized = mergeSchemas(normalized, normalizeSchema(variant, rootSchema, seenRefs));
    }
  }
  return normalized;
}

function schemaType(schema: Record<string, unknown>): string | null {
  if (typeof schema.type === "string") return schema.type;
  if (Array.isArray(schema.type)) {
    return schema.type.find((type): type is string => typeof type === "string" && type !== "null") ?? null;
  }
  return null;
}

/** Finds the materialized schema for a concrete tracker path, including array indices. */
export function getTrackerSchemaAtPath(
  rootSchema: Record<string, unknown>,
  path: TrackerEditPath,
): Record<string, unknown> {
  let current: unknown = rootSchema;
  for (const segment of path) {
    const normalized = normalizeSchema(current, rootSchema);
    if (typeof segment === "number") {
      current = normalized.items;
      continue;
    }
    current = getRecord(normalized.properties)[segment];
  }
  return normalizeSchema(current, rootSchema);
}

export function getTrackerEditControlKind(
  schema: Record<string, unknown>,
  value: unknown,
): TrackerEditControlKind {
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return "enum";
  const type = schemaType(schema);
  if (type === "boolean" || typeof value === "boolean") return "boolean";
  if (type === "integer") return "integer";
  if (type === "number" || typeof value === "number") return "number";
  if (type === "array" || Array.isArray(value)) {
    const itemSchema = normalizeSchema(schema.items, schema);
    const itemType = schemaType(itemSchema);
    if (itemType === "integer") return "integer_array";
    if (itemType === "number") return "number_array";
    const sample = Array.isArray(value) ? value.find((item) => item !== null && item !== undefined) : undefined;
    if (typeof sample === "number") return Number.isInteger(sample) ? "integer_array" : "number_array";
    return "string_array";
  }
  return "string";
}

function parseNumericValue(raw: string, integer: boolean): unknown {
  if (raw.trim() === "") return "";
  const value = Number(raw);
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value))) return raw;
  return value;
}

export function parseTrackerEditValue(
  kind: TrackerEditControlKind,
  raw: string,
  schema: Record<string, unknown>,
): unknown {
  if (kind === "enum") {
    const index = Number(raw);
    return Number.isSafeInteger(index) && Array.isArray(schema.enum) && index >= 0 && index < schema.enum.length
      ? structuredClone(schema.enum[index])
      : raw;
  }
  if (kind === "boolean") return raw === "true";
  if (kind === "number") return parseNumericValue(raw, false);
  if (kind === "integer") return parseNumericValue(raw, true);
  if (kind.endsWith("_array")) {
    const values = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (kind === "number_array") return values.map((item) => parseNumericValue(item, false));
    if (kind === "integer_array") return values.map((item) => parseNumericValue(item, true));
    return values;
  }
  return raw;
}

/** Mutates only the private edit draft and refuses prototype-polluting paths. */
export function setTrackerValueAtPath(root: unknown, path: TrackerEditPath, value: unknown): boolean {
  if (!root || typeof root !== "object" || path.length === 0) return false;
  let current: any = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    if (typeof segment === "string" && blockedPathKeys.has(segment)) return false;
    const nextSegment = path[index + 1];
    let next = current[segment];
    if (!next || typeof next !== "object") {
      next = typeof nextSegment === "number" ? [] : {};
      current[segment] = next;
    }
    current = next;
  }
  const finalSegment = path[path.length - 1];
  if (typeof finalSegment === "string" && blockedPathKeys.has(finalSegment)) return false;
  current[finalSegment] = value;
  return true;
}

export function removeTrackerArrayItem(root: unknown, path: TrackerEditPath, index: number): boolean {
  const value = getTrackerValueAtPath(root, path);
  if (!Array.isArray(value) || index < 0 || index >= value.length) return false;
  value.splice(index, 1);
  return true;
}

export function appendTrackerArrayItem(root: unknown, path: TrackerEditPath, value: unknown): boolean {
  const current = getTrackerValueAtPath(root, path);
  if (!Array.isArray(current)) return setTrackerValueAtPath(root, path, [value]);
  current.push(value);
  return true;
}

export function getTrackerValueAtPath(root: unknown, path: TrackerEditPath): unknown {
  let current = root;
  for (const segment of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as any)[segment];
  }
  return current;
}

export function cloneTrackerEditValue<T>(value: T): T {
  return structuredClone(value);
}

export function createTrackerEditDefaultValue(schema: Record<string, unknown>, depth = 0): unknown {
  if (Object.prototype.hasOwnProperty.call(schema, "default")) return structuredClone(schema.default);
  if (Object.prototype.hasOwnProperty.call(schema, "const")) return structuredClone(schema.const);
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return structuredClone(schema.enum[0]);
  if (depth >= 12) return null;
  const type = schemaType(schema);
  if (type === "object" || schema.properties) {
    const properties = getRecord(schema.properties);
    const required = Array.isArray(schema.required)
      ? schema.required.filter((key): key is string => typeof key === "string" && !blockedPathKeys.has(key))
      : [];
    return Object.fromEntries(required.map((key) => [
      key,
      createTrackerEditDefaultValue(getRecord(properties[key]), depth + 1),
    ]));
  }
  if (type === "array") return [];
  if (type === "boolean") return false;
  if (type === "number" || type === "integer") {
    return typeof schema.minimum === "number" ? schema.minimum : 0;
  }
  return "";
}
