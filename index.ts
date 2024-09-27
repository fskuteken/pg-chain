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

        if (param instanceof PgFragmentChain) {
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

export class PgFragmentChain {
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

  AND (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  AND (chain: PgFragmentChain): PgFragmentChain
  AND (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('AND', templateOrChain, ...params)
  }

  AS (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  AS (chain: PgFragmentChain): PgFragmentChain
  AS (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('AS', templateOrChain, ...params)
  }

  FROM (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  FROM (chain: PgFragmentChain): PgFragmentChain
  FROM (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('FROM', templateOrChain, ...params)
  }

  OR (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  OR (chain: PgFragmentChain): PgFragmentChain
  OR (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('OR', templateOrChain, ...params)
  }

  RETURNING (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  RETURNING (chain: PgFragmentChain): PgFragmentChain
  RETURNING (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('RETURNING', templateOrChain, ...params)
  }

  SELECT (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  SELECT (chain: PgFragmentChain): PgFragmentChain
  SELECT (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('SELECT', templateOrChain, ...params)
  }

  SET (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  SET (chain: PgFragmentChain): PgFragmentChain
  SET (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('SET', templateOrChain, ...params)
  }

  get UNION (): PgFragmentChain {
    return new PgFragmentChain([
      ...this._fragments,
      new PgFragment(['', ''] as any, [], 'UNION')
    ])
  }

  VALUES (...params: any[]): PgFragmentChain {
    if (params.length === 0) {
      return new PgFragmentChain([
        ...this._fragments,
        new PgFragment([''] as any, [], 'VALUES (', ')')
      ])
    }

    return new PgFragmentChain([
      ...this._fragments,
      new PgFragment(['', ...new Array(params.length - 1).fill(', '), ''] as any, params, 'VALUES (', ')')
    ])
  }

  WHERE (template: TemplateStringsArray, ...params: any[]): PgFragmentChain
  WHERE (chain: PgFragmentChain): PgFragmentChain
  WHERE (templateOrChain: TemplateStringsArray | PgFragmentChain, ...params: any[]): PgFragmentChain {
    return this.chainable('WHERE', templateOrChain, ...params)
  }

  private chainable (
    keyword: string,
    templateOrChain: TemplateStringsArray | PgFragmentChain,
    ...params: any[]
  ): PgFragmentChain {
    if (templateOrChain instanceof PgFragmentChain) {
      return new PgFragmentChain([
        ...this._fragments,
        new PgFragment(['', ''] as any, [templateOrChain], `${keyword} (`, ')')
      ])
    } else {
      return new PgFragmentChain([
        ...this._fragments,
        new PgFragment(templateOrChain, params, `${keyword} `)
      ])
    }
  }
}

export function DELETE_FROM (template: TemplateStringsArray, ...params: any[]): PgFragmentChain {
  return new PgFragmentChain([
    new PgFragment(template, params, 'DELETE FROM ')
  ])
}

export function EXISTS (...params: any[]): PgFragmentChain {
  if (params.length === 0) {
    return new PgFragmentChain([
      new PgFragment([''] as any, [], 'EXISTS (', ')')
    ])
  }

  return new PgFragmentChain([
    new PgFragment(['', ...new Array(params.length - 1).fill(', '), ''] as any, params, 'EXISTS (', ')')
  ])
}

export function INSERT_INTO (template: TemplateStringsArray, ...params: any[]): PgFragmentChain {
  return new PgFragmentChain([
    new PgFragment(template, params, 'INSERT INTO ')
  ])
}

export function SELECT (template: TemplateStringsArray, ...params: any[]): PgFragmentChain {
  return new PgFragmentChain([
    new PgFragment(template, params, 'SELECT ')
  ])
}

export function UPDATE (template: TemplateStringsArray, ...params: any[]): PgFragmentChain {
  return new PgFragmentChain([
    new PgFragment(template, params, 'UPDATE ')
  ])
}

export function WITH_RECURSIVE (template: TemplateStringsArray, ...params: any[]): PgFragmentChain {
  return new PgFragmentChain([
    new PgFragment(template, params, 'WITH_RECURSIVE ')
  ])
}
