const ROUTE_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'head', 'options'])
const PRIMITIVE_TYPES = new Set([
  'bool',
  'byte',
  'complex64',
  'complex128',
  'float32',
  'float64',
  'int',
  'int8',
  'int16',
  'int32',
  'int64',
  'rune',
  'string',
  'uint',
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'uintptr',
])

function normalizeSource(source) {
  return source.replace(/\r\n?/g, '\n')
}

function stripLineComment(line) {
  const commentIndex = line.indexOf('//')
  return commentIndex === -1 ? line : line.slice(0, commentIndex)
}

function parseFieldType(rawType) {
  const typeName = rawType.trim()

  if (typeName.startsWith('[]')) {
    return {
      kind: 'array',
      typeName: typeName.slice(2).trim(),
    }
  }

  if (typeName.startsWith('*')) {
    return {
      kind: 'ref',
      typeName: typeName.slice(1).trim(),
    }
  }

  if (PRIMITIVE_TYPES.has(typeName)) {
    return {
      kind: 'primitive',
      typeName,
    }
  }

  return {
    kind: 'ref',
    typeName,
  }
}

function parseFieldLine(line) {
  const trimmed = line.trim()
  if (!trimmed) {
    return null
  }

  const tagMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+?)(?:\s+`json:"([^"]+)"`)?$/)
  if (!tagMatch) {
    const embeddedType = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)$/)
    if (!embeddedType) {
      return null
    }

    return {
      name: embeddedType[1],
      jsonName: null,
      embeddedTypeName: embeddedType[1],
      type: {
        kind: 'embedded',
        typeName: embeddedType[1],
      },
    }
  }

  const [, name, rawType, rawJsonTag] = tagMatch
  const jsonName = rawJsonTag ? rawJsonTag.split(',')[0].trim() : name

  return {
    name,
    jsonName,
    type: parseFieldType(rawType),
  }
}

function finalizeType(typeName, fields) {
  const fieldsByName = {}
  for (const field of fields) {
    if (!field.jsonName) {
      continue
    }
    fieldsByName[field.jsonName] = field.type
  }

  const data = fieldsByName.data ?? { kind: 'none' }

  return {
    name: typeName,
    fields,
    fieldsByName,
    data,
  }
}

function parseTypeDeclarations(lines) {
  const typesByName = {}
  let inGroupedTypeBlock = false
  let currentTypeName = null
  let currentFields = []

  const flushCurrentType = () => {
    if (!currentTypeName) {
      return
    }

    typesByName[currentTypeName] = finalizeType(currentTypeName, currentFields)
    currentTypeName = null
    currentFields = []
  }

  for (const rawLine of lines) {
    const line = stripLineComment(rawLine).trim()
    if (!line) {
      continue
    }

    if (!inGroupedTypeBlock && currentTypeName === null) {
      const singleTypeMatch = line.match(/^type\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{$/)
      if (singleTypeMatch) {
        currentTypeName = singleTypeMatch[1]
        currentFields = []
        continue
      }

      if (line === 'type (') {
        inGroupedTypeBlock = true
      }
      continue
    }

    if (inGroupedTypeBlock && currentTypeName === null) {
      if (line === ')') {
        inGroupedTypeBlock = false
        continue
      }

      const groupedTypeMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\{$/)
      if (groupedTypeMatch) {
        currentTypeName = groupedTypeMatch[1]
        currentFields = []
      }
      continue
    }

    if (line === '}') {
      flushCurrentType()
      continue
    }

    const field = parseFieldLine(line)
    if (field) {
      currentFields.push(field)
    }
  }

  flushCurrentType()
  return typesByName
}

function parseRoutes(lines) {
  const routes = []
  let inServiceBlock = false
  let pendingHandler = null

  for (const rawLine of lines) {
    const line = stripLineComment(rawLine).trim()
    if (!line) {
      continue
    }

    if (!inServiceBlock) {
      if (line.startsWith('service ')) {
        inServiceBlock = true
      }
      continue
    }

    if (line === '}') {
      inServiceBlock = false
      pendingHandler = null
      continue
    }

    const handlerMatch = line.match(/^@handler\s+([A-Za-z_][A-Za-z0-9_]*)$/)
    if (handlerMatch) {
      pendingHandler = handlerMatch[1]
      continue
    }

    const routeMatch = line.match(/^(get|post|put|delete|patch|head|options)\s+(\S+)\s+\(([^)]+)\)\s+returns\s+\(([^)]+)\)$/i)
    if (!routeMatch) {
      continue
    }

    const [, method, path, requestType, responseType] = routeMatch
    routes.push({
      method: method.toUpperCase(),
      path,
      requestType,
      responseType,
    })
    pendingHandler = null
  }

  return routes
}

export function parseJobApi(source) {
  const normalized = normalizeSource(source)
  const lines = normalized.split('\n')

  return {
    typesByName: parseTypeDeclarations(lines),
    routes: parseRoutes(lines),
  }
}
