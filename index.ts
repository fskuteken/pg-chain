export class PgChain {
  private strings: TemplateStringsArray
  private args: any[]
  private prev: PgChain | null
  private next: PgChain | null

  constructor (strings: TemplateStringsArray, args: any[]) {
    this.strings = strings
    this.args = args
    this.prev = null
    this.next = null
  }

  get text (): string {
    const [sql] = this.toSql()

    return sql
  }

  get values (): any[] {
    const [, args] = this.toSql()

    return args
  }

  chain (chain: PgChain, ...args: any[]): PgChain
  chain (strings: TemplateStringsArray, ...args: any[]): PgChain
  chain (stringsOrChain: TemplateStringsArray | PgChain, ...args: any[]): PgChain
  chain (stringsOrChain: TemplateStringsArray | PgChain, ...args: any[]): PgChain {
    if (stringsOrChain instanceof PgChain) {
      return this.chain`(${stringsOrChain})`
    } else {
      const next = new PgChain(stringsOrChain, args)
      this.next = next
      next.prev = this
      return next
    }
  }

  head (): PgChain {
    let head: PgChain = this

    while (head.prev) {
      head = head.prev
    }

    return head
  }

  toSql (index: number = 0): [sql: string, args: any[]] {
    const head = this.head()
    let current: PgChain | null = head

    const sqlAcc: string[] = []
    const acc: any[] = []

    while (current) {
      const { strings, args } = current

      let sql = ''

      for (let i = 0; i < strings.length; i++) {
        sql += strings[i]

        if (i < args.length) {
          const arg = args[i]

          if (arg instanceof PgChain) {
            const [argSql, argArgs] = arg.toSql(index)
            sql += argSql
            acc.push(...argArgs)
            index += argArgs.length
          } else {
            sql += `$${index + 1}`
            index++
            acc.push(arg)
          }
        }
      }

      if (sql) {
        sqlAcc.push(sql)
      }

      current = current.next
    }

    return [sqlAcc.join(' '), acc]
  }

  if (condition: boolean, callback: (chain: PgChain) => PgChain): PgChain {
    return condition ? callback(this) : this
  }

  FROM (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`FROM`.chain(strings, ...args)
  }

  JOIN (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`JOIN`.chain(strings, ...args)
  }

  LEFT_JOIN (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`LEFT JOIN`.chain(strings, ...args)
  }

  ON (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`ON`.chain(strings, ...args)
  }

  WHERE (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`WHERE`.chain(strings, ...args)
  }

  GROUP_BY (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`GROUP BY`.chain(strings, ...args)
  }

  AND (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`AND`.chain(strings, ...args)
  }

  OR (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`OR`.chain(strings, ...args)
  }

  LIMIT (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`LIMIT`.chain(strings, ...args)
  }

  OFFSET (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`OFFSET`.chain(strings, ...args)
  }

  VALUES (...args: any[]): PgChain
  VALUES (chain: PgChain, ...args: any[]): PgChain
  VALUES (strings: TemplateStringsArray, ...args: any[]): PgChain
  VALUES (stringsOrChainOrArgs: TemplateStringsArray | PgChain | any, ...args: any[]): PgChain {
    if (stringsOrChainOrArgs instanceof PgChain) {
      return this.chain`VALUES`.chain(stringsOrChainOrArgs, ...args)
    } else if (
      Array.isArray(stringsOrChainOrArgs) &&
      'raw' in stringsOrChainOrArgs &&
      Array.isArray(stringsOrChainOrArgs.raw)
    ) {
      return this.chain`VALUES`.chain(stringsOrChainOrArgs as TemplateStringsArray, ...args)
    } else {
      const allArgs = [stringsOrChainOrArgs, ...args]
      const strings: any = ['', ...new Array(allArgs.length - 1).fill(', ')] as any[] as any
      strings.raw = []

      return this.chain`VALUES`.chain(new PgChain(strings, allArgs))
    }
  }

  ON_CONFLICT (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`ON CONFLICT`.chain(strings, ...args)
  }

  ORDER_BY (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`ORDER BY`.chain(strings, ...args)
  }

  DO_NOTHING (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`DO NOTHING`.chain(strings, ...args)
  }

  RETURNING (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`RETURNING`.chain(strings, ...args)
  }

  SET (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`SET`.chain(strings, ...args)
  }

  AS (chain: PgChain, ...args: any[]): PgChain
  AS (strings: TemplateStringsArray, ...args: any[]): PgChain
  AS (stringsOrChain: TemplateStringsArray | PgChain, ...args: any[]): PgChain {
    return this.chain`AS`.chain(stringsOrChain, ...args)
  }

  UNION (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`UNION`.chain(strings, ...args)
  }

  SELECT (strings: TemplateStringsArray, ...args: any[]): PgChain {
    return this.chain`SELECT`.chain(strings, ...args)
  }
}

export function chain (strings: TemplateStringsArray, ...args: any[]): PgChain {
  return new PgChain(strings, args)
}

export function BEGIN (): PgChain {
  return chain`BEGIN`
}
BEGIN.text = 'BEGIN'

export function COMMIT (): PgChain {
  return chain`COMMIT`
}
COMMIT.text = 'COMMIT'

export function ROLLBACK (): PgChain {
  return chain`ROLLBACK`
}
ROLLBACK.text = 'ROLLBACK'

export function DELETE_FROM (strings: TemplateStringsArray, ...args: any[]): PgChain {
  return chain`DELETE FROM`.chain(strings, ...args)
}

export function INSERT_INTO (strings: TemplateStringsArray, ...args: any[]): PgChain
export function INSERT_INTO (table: string, ...rows: Record<string, any>[]): PgChain
export function INSERT_INTO (stringsOrTable: string | TemplateStringsArray, ...argsOrRows: any[]): PgChain {
  if (typeof stringsOrTable === 'string') {
    const keys = Object.keys(argsOrRows[0])
    const colsLength = keys.length
    const rowsLength = argsOrRows.length

    const strings: any = [
      `INSERT INTO ${stringsOrTable} (${keys.join(', ')}) VALUES (`,
      ...Array.from({ length: colsLength - 1 }).map(() => ', '),
      ...Array.from({ length: rowsLength - 1 }).map(() =>
        Array.from({ length: colsLength }).map((_, index) => index === 0 ? '), (' : ', ')
      ).reduce((acc, curr) => acc.concat(curr), []),
      ')'
    ]
    strings.raw = []

    console.log(strings)

    const args: any[] = argsOrRows.reduce((acc, row) => acc.concat(Object.values(row)), [])

    return new PgChain(strings, args)
  } else {
    return chain`INSERT INTO`.chain(stringsOrTable, ...argsOrRows)
  }
}

INSERT_INTO`users (name, status)`.VALUES`(${1}, ${2})`
INSERT_INTO('users', { name: 'Alice', status: 'active' })

export function SELECT (strings: TemplateStringsArray, ...args: any[]): PgChain {
  return chain`SELECT`.chain(strings, ...args)
}

export function UPDATE (strings: TemplateStringsArray, ...args: any[]): PgChain {
  return chain`UPDATE`.chain(strings, ...args)
}

export function WITH_RECURSIVE (strings: TemplateStringsArray, ...args: any[]): PgChain {
  return chain`WITH RECURSIVE`.chain(strings, ...args)
}

export function WHERE (strings: TemplateStringsArray, ...args: any[]): PgChain {
  return chain`WHERE`.chain(strings, ...args)
}

export function EXISTS (stringsOrChain: TemplateStringsArray | PgChain, ...args: any[]): PgChain {
  return chain`EXISTS`.chain(stringsOrChain, ...args)
}
