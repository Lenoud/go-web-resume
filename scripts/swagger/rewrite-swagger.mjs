import { createHash } from 'node:crypto'

const SWAGGER_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options'])
const DEFINITION_PREFIX = '#/definitions/'

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function cloneSchema(schema) {
  return structuredClone(schema)
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item))
  }

  if (!isPlainObject(value)) {
    return value
  }

  const normalized = {}
  for (const key of Object.keys(value).sort()) {
    const nextValue = normalizeValue(value[key])
    normalized[key] = key === 'required' && Array.isArray(nextValue) ? [...nextValue].sort() : nextValue
  }

  return normalized
}

function hashSchema(schema) {
  return createHash('sha256').update(JSON.stringify(normalizeValue(schema))).digest('hex')
}

function definitionRef(name) {
  return { $ref: `${DEFINITION_PREFIX}${name}` }
}

function registerDefinition({ definitions, registry, name, schema }) {
  const hash = hashSchema(schema)
  const existing = registry.get(name)

  if (existing) {
    if (existing.hash !== hash) {
      throw new Error(`Definition "${name}" already exists with a different schema`)
    }

    return definitionRef(name)
  }

  registry.set(name, { hash })
  definitions[name] = schema
  return definitionRef(name)
}

function buildDefinitionRegistry(definitions) {
  const registry = new Map()

  for (const [name, schema] of Object.entries(definitions)) {
    registry.set(name, { hash: hashSchema(schema) })
  }

  return registry
}

function buildRouteRegistry(routes = []) {
  const byOperationId = new Map()
  const byMethodPath = new Map()

  for (const route of routes) {
    if (route?.operationId && !byOperationId.has(route.operationId)) {
      byOperationId.set(route.operationId, route)
    }

    if (route?.method && route?.path) {
      const key = `${route.method.toUpperCase()} ${route.path}`
      if (!byMethodPath.has(key)) {
        byMethodPath.set(key, route)
      }
    }
  }

  return { byOperationId, byMethodPath }
}

function findRoute({ method, path, operation, routeRegistry }) {
  if (operation?.operationId && routeRegistry.byOperationId.has(operation.operationId)) {
    return routeRegistry.byOperationId.get(operation.operationId)
  }

  return routeRegistry.byMethodPath.get(`${method.toUpperCase()} ${path}`) ?? null
}

function routeKey(route) {
  return route.operationId ?? `${route.method.toUpperCase()} ${route.path}`
}

function assertCompatibleDataShape({ responseTypeName, dataType, schema }) {
  if (dataType.kind === 'none' || dataType.kind === 'primitive' || dataType.kind === 'embedded') {
    return
  }

  const dataSchema = schema?.properties?.data
  if (!isPlainObject(dataSchema)) {
    throw new Error(`Response "${responseTypeName}" has data incompatible with swagger data shape`)
  }

  if (dataType.kind === 'ref') {
    if (dataSchema.$ref || dataSchema.type === 'object') {
      return
    }

    throw new Error(`Response "${responseTypeName}" has data incompatible with swagger data shape`)
  }

  if (dataType.kind === 'array') {
    const itemSchema = dataSchema.items
    if (dataSchema.type === 'array' && itemSchema && (itemSchema.$ref || itemSchema.type === 'object')) {
      return
    }

    throw new Error(`Response "${responseTypeName}" has data incompatible with swagger data shape`)
  }
}

function rewriteFieldSchema({ schema, fieldType, context }) {
  if (!fieldType || !isPlainObject(schema)) {
    return schema
  }

  if (fieldType.kind === 'ref' && !schema.$ref) {
    return hoistNamedSchema({
      schema,
      typeName: fieldType.typeName,
      context,
    })
  }

  if (fieldType.kind !== 'array' || schema.type !== 'array' || !schema.items || schema.items.$ref) {
    return schema
  }

  const rewrittenArray = cloneSchema(schema)

  if (fieldType.typeName && context.typesByName[fieldType.typeName]) {
    rewrittenArray.items = hoistNamedSchema({
      schema: rewrittenArray.items,
      typeName: fieldType.typeName,
      context,
    })
  }

  return rewrittenArray
}

function rewriteSchemaShape({ schema, typeName, context }) {
  const rewritten = cloneSchema(schema)
  const typeMeta = context.typesByName[typeName]

  if (!typeMeta || !isPlainObject(rewritten) || !isPlainObject(rewritten.properties)) {
    return rewritten
  }

  assertCompatibleDataShape({
    responseTypeName: typeName,
    dataType: typeMeta.data,
    schema: rewritten,
  })

  for (const [propertyName, propertySchema] of Object.entries(rewritten.properties)) {
    const fieldType = typeMeta.fieldsByName[propertyName]
    if (!fieldType) {
      continue
    }

    rewritten.properties[propertyName] = rewriteFieldSchema({
      schema: propertySchema,
      fieldType,
      context,
    })
  }

  return rewritten
}

function hoistNamedSchema({ schema, typeName, context }) {
  const dereferenced = dereferenceSchema({
    root: context.root,
    schema,
  })
  const rewritten = rewriteSchemaShape({
    schema: dereferenced,
    typeName,
    context,
  })

  return registerDefinition({
    definitions: context.definitions,
    registry: context.registry,
    name: typeName,
    schema: rewritten,
  })
}

function dereferenceRef({ root, ref, seen }) {
  if (!ref.startsWith(DEFINITION_PREFIX)) {
    return { $ref: ref }
  }

  const definitionName = ref.slice(DEFINITION_PREFIX.length)
  const target = root?.definitions?.[definitionName]
  if (!target) {
    throw new Error(`Unable to resolve schema reference "${ref}"`)
  }

  if (seen.has(ref)) {
    return seen.get(ref)
  }

  const placeholder = {}
  seen.set(ref, placeholder)
  const resolved = dereferenceSchema({
    root,
    schema: target,
    seen,
  })

  Object.assign(placeholder, resolved)
  return resolved
}

export function dereferenceSchema({ root, schema, seen = new Map() }) {
  if (Array.isArray(schema)) {
    return schema.map((item) => dereferenceSchema({ root, schema: item, seen }))
  }

  if (!isPlainObject(schema)) {
    return schema
  }

  if (schema.$ref) {
    return dereferenceRef({
      root,
      ref: schema.$ref,
      seen,
    })
  }

  const resolved = {}
  for (const [key, value] of Object.entries(schema)) {
    resolved[key] = dereferenceSchema({
      root,
      schema: value,
      seen,
    })
  }

  return resolved
}

export function rewriteSwaggerDoc({ parsed, swaggerDoc }) {
  const rewritten = cloneSchema(swaggerDoc)
  rewritten.definitions = cloneSchema(rewritten.definitions ?? {})

  const context = {
    root: rewritten,
    definitions: rewritten.definitions,
    registry: buildDefinitionRegistry(rewritten.definitions),
    routes: buildRouteRegistry(parsed?.routes ?? []),
    typesByName: parsed?.typesByName ?? {},
  }

  const matchedRoutes = new Set()

  for (const [path, pathItem] of Object.entries(rewritten.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!SWAGGER_METHODS.has(method) || !operation?.responses) {
        continue
      }

      const route = findRoute({
        method,
        path,
        operation,
        routeRegistry: context.routes,
      })
      if (!route?.responseType) {
        continue
      }

      matchedRoutes.add(routeKey(route))

      const successResponse = operation.responses?.[200] ?? operation.responses?.['200']
      if (!successResponse?.schema) {
        throw new Error(`Parsed route "${routeKey(route)}" is missing responses.200.schema`)
      }

      successResponse.schema = hoistNamedSchema({
        schema: successResponse.schema,
        typeName: route.responseType,
        context,
      })
    }
  }

  for (const route of parsed?.routes ?? []) {
    if (!route?.responseType || matchedRoutes.has(routeKey(route))) {
      continue
    }

    throw new Error(`Parsed route "${routeKey(route)}" was not matched`)
  }

  return rewritten
}
