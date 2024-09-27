class PgFragment {
  private readonly _template: TemplateStringsArray
  private readonly _params: any[]
  private readonly _prefix?: string
  private readonly _suffix?: string

  constructor (
    template: TemplateStringsArray,
    params: any[],
    prefix?: string,
    suffix?: string
  ) {
    this._template = template
    this._params = params
    this._prefix = prefix
    this._suffix = suffix
  }

  toString (): string {
    const [sql] = this.toSql()

    return sql
  }

  toSql (index: number = 0): [sql: string, params: any[]] {
    let sql = ''
    const params: any[] = []

    for (let i = 0; i < this._template.length; i++) {
      sql += this._template[i]

      if (i < this._params.length) {
        const param = this._params[i]

        if (param instanceof PgChain) {
          const [fragmentSql, fragmentParams] = param.toSql(index)
          sql += fragmentSql
          params.push(...fragmentParams)
          index += fragmentParams.length
        } else {
          sql += `$${++index}`

          params.push(this._params[i])
        }
      }
    }

    const prefix = this._prefix ?? ''
    const suffix = this._suffix ?? ''
    const wrappedSql = `${prefix}${sql}${suffix}`

    return [wrappedSql, params]
  }
}

export class PgChain {
  private readonly _fragments: PgFragment[]

  constructor (fragments: PgFragment[]) {
    this._fragments = fragments
  }

  toString (): string {
    const [sql] = this.toSql()

    return sql
  }

  toSql (index = 0): [sql: string, params: any[]] {
    const parts: string[] = []
    const params: any[] = []

    for (const fragment of this._fragments) {
      const [fragmentSql, fragmentParams] = fragment.toSql(index)

      index += fragmentParams.length
      parts.push(fragmentSql)
      params.push(...fragmentParams)
    }

    const sql = parts.join(' ')

    return [sql, params]
  }

  AND (template: TemplateStringsArray, ...params: any[]): PgChain
  AND (chain: PgChain): PgChain
  AND (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('AND', templateOrChain, ...params)
  }

  AS (template: TemplateStringsArray, ...params: any[]): PgChain
  AS (chain: PgChain): PgChain
  AS (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('AS', templateOrChain, ...params)
  }

  FROM (template: TemplateStringsArray, ...params: any[]): PgChain
  FROM (chain: PgChain): PgChain
  FROM (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('FROM', templateOrChain, ...params)
  }

  OR (template: TemplateStringsArray, ...params: any[]): PgChain
  OR (chain: PgChain): PgChain
  OR (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('OR', templateOrChain, ...params)
  }

  RETURNING (template: TemplateStringsArray, ...params: any[]): PgChain
  RETURNING (chain: PgChain): PgChain
  RETURNING (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('RETURNING', templateOrChain, ...params)
  }

  SELECT (template: TemplateStringsArray, ...params: any[]): PgChain
  SELECT (chain: PgChain): PgChain
  SELECT (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('SELECT', templateOrChain, ...params)
  }

  SET (template: TemplateStringsArray, ...params: any[]): PgChain
  SET (chain: PgChain): PgChain
  SET (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('SET', templateOrChain, ...params)
  }

  get UNION (): PgChain {
    return new PgChain([
      ...this._fragments,
      new PgFragment(['', ''] as any, [], 'UNION')
    ])
  }

  VALUES (...params: any[]): PgChain {
    if (params.length === 0) {
      return new PgChain([
        ...this._fragments,
        new PgFragment([''] as any, [], 'VALUES (', ')')
      ])
    }

    return new PgChain([
      ...this._fragments,
      new PgFragment(['', ...new Array(params.length - 1).fill(', '), ''] as any, params, 'VALUES (', ')')
    ])
  }

  WHERE (template: TemplateStringsArray, ...params: any[]): PgChain
  WHERE (chain: PgChain): PgChain
  WHERE (templateOrChain: TemplateStringsArray | PgChain, ...params: any[]): PgChain {
    return this.chainable('WHERE', templateOrChain, ...params)
  }

  private chainable (
    keyword: string,
    templateOrChain: TemplateStringsArray | PgChain,
    ...params: any[]
  ): PgChain {
    if (templateOrChain instanceof PgChain) {
      return new PgChain([
        ...this._fragments,
        new PgFragment(['', ''] as any, [templateOrChain], `${keyword} (`, ')')
      ])
    } else {
      return new PgChain([
        ...this._fragments,
        new PgFragment(templateOrChain, params, `${keyword} `)
      ])
    }
  }
}

export function DELETE_FROM (template: TemplateStringsArray, ...params: any[]): PgChain {
  return new PgChain([
    new PgFragment(template, params, 'DELETE FROM ')
  ])
}

export function EXISTS (...params: any[]): PgChain {
  if (params.length === 0) {
    return new PgChain([
      new PgFragment([''] as any, [], 'EXISTS (', ')')
    ])
  }

  return new PgChain([
    new PgFragment(['', ...new Array(params.length - 1).fill(', '), ''] as any, params, 'EXISTS (', ')')
  ])
}

export function INSERT_INTO (template: TemplateStringsArray, ...params: any[]): PgChain {
  return new PgChain([
    new PgFragment(template, params, 'INSERT INTO ')
  ])
}

export function SELECT (template: TemplateStringsArray, ...params: any[]): PgChain {
  return new PgChain([
    new PgFragment(template, params, 'SELECT ')
  ])
}

export function UPDATE (template: TemplateStringsArray, ...params: any[]): PgChain {
  return new PgChain([
    new PgFragment(template, params, 'UPDATE ')
  ])
}

export function WITH_RECURSIVE (template: TemplateStringsArray, ...params: any[]): PgChain {
  return new PgChain([
    new PgFragment(template, params, 'WITH_RECURSIVE ')
  ])
}
