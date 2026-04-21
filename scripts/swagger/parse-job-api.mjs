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

function stripComments(source) {
  let result = ''
  let inBlockComment = false

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    const next = source[i + 1]

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        i += 1
      } else if (char === '\n') {
        result += char
      }
      continue
    }

    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        i += 1
      }
      if (source[i] === '\n') {
        result += '\n'
      }
      continue
    }

    if (char === '/' && next === '*') {
      inBlockComment = true
      i += 1
      continue
    }

    result += char
  }

  return result
}

function parseFieldType(rawType) {
  const typeName = rawType.trim().split(/\s+/, 1)[0]

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

  const embeddedType = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)$/)
  if (embeddedType) {
    return {
      name: embeddedType[1],
      jsonName: null,
      type: {
        kind: 'embedded',
        typeName: embeddedType[1],
      },
    }
  }

  const nameMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/)
  if (!nameMatch) {
    const embeddedType = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)$/)
    return embeddedType
      ? {
          name: embeddedType[1],
          jsonName: null,
          type: {
            kind: 'embedded',
            typeName: embeddedType[1],
          },
        }
      : null
  }

  const [, name, remainder] = nameMatch
  const jsonTagMatch = remainder.match(/`json:"([^"]+)"/)
  const typeSegment = jsonTagMatch ? remainder.slice(0, jsonTagMatch.index).trim() : remainder.trim()
  const jsonName = jsonTagMatch ? jsonTagMatch[1].split(',')[0].trim() : name

  return {
    name,
    jsonName,
    type: parseFieldType(typeSegment),
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
    const line = rawLine.trim()
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

  for (const rawLine of lines) {
    const line = rawLine.trim()
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
      continue
    }

    const routeMatch = line.match(/^([a-z]+)\s+(\S+)\s+\(([^)]+)\)\s+returns\s+\(([^)]+)\)$/i)
    if (!routeMatch) {
      continue
    }

    const [, method, path, requestType, responseType] = routeMatch
    if (!ROUTE_METHODS.has(method.toLowerCase())) {
      continue
    }

    routes.push({
      method: method.toUpperCase(),
      path,
      requestType,
      responseType,
    })
  }

  return routes
}

export function parseJobApi(source) {
  const normalized = normalizeSource(source)
  const stripped = stripComments(normalized)
  const lines = stripped.split('\n')

  return {
    typesByName: parseTypeDeclarations(lines),
    routes: parseRoutes(lines),
  }
}
