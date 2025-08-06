import { describe, expect, test } from 'vitest'
import { DELETE_FROM, EXISTS, INSERT_INTO, SELECT, UPDATE, WHERE, WITH_RECURSIVE } from './index'

describe('chain', () => {
  test('DELETE FROM users WHERE id = $1', () => {
    const chain = DELETE_FROM`users`.WHERE`id = ${1}`

    const [sql, params] = chain.toSql()

    expect(sql).toBe('DELETE FROM users WHERE id = $1')
    expect(params).toEqual([1])
  })

  test('INSERT INTO users (name, status) VALUES ($1, $2) RETURNING id', () => {
    const chain =
      INSERT_INTO`users (name, status)`.
      VALUES('Alice', 'active').
      RETURNING`id`

    const [sql, params] = chain.toSql()

    expect(sql).toBe('INSERT INTO users (name, status) VALUES ($1, $2) RETURNING id')
    expect(params).toEqual(['Alice', 'active'])
  })

  test('SELECT id, name FROM users WHERE id = $1', () => {
    const chain = SELECT`id, name`.FROM`users`.WHERE`id = ${1}`

    const [sql, params] = chain.toSql()

    expect(sql).toBe('SELECT id, name FROM users WHERE id = $1')
    expect(params).toEqual([1])
  })

  test('SELECT id, name FROM users WHERE status = $1 OR role = $2', () => {
    const chain = SELECT`id, name`.FROM`users`.WHERE`status = ${'active'}`.OR`role = ${'admin'}`

    const [sql, params] = chain.toSql()

    expect(sql).toBe('SELECT id, name FROM users WHERE status = $1 OR role = $2')
    expect(params).toEqual(['active', 'admin'])
  })

  test('SELECT id, name FROM users WHERE id = $1', () => {
    const chain =
      SELECT`id, name`.
        FROM`users`.
       WHERE`status = 'active'`.
         AND`${EXISTS(SELECT`*`.FROM`posts`.WHERE`user_id = users.id`)}`

    const [sql, params] = chain.toSql()

    expect(sql).toBe(
      `SELECT id, name FROM users
        WHERE status = 'active'
          AND EXISTS (SELECT * FROM posts WHERE user_id = users.id)`
      .replace(/\s\s+/g, ' ')
    )
    expect(params).toEqual([])
  })

  test('SELECT COUNT(*)', () => {
    const authorId = 12
    const status = 'published'

    const conditionals = WHERE`author_id = ${authorId}`.AND`status = ${status}`

    const rows = SELECT`id, title`.FROM`post`.chain`${conditionals}`
    const count = SELECT`COUNT(*)`.FROM`post`.chain`${conditionals}`

    expect(rows.text).toBe('SELECT id, title FROM post WHERE author_id = $1 AND status = $2')
    expect(rows.values).toMatchObject([authorId, status])
    expect(count.text).toBe('SELECT COUNT(*) FROM post WHERE author_id = $1 AND status = $2')
    expect(count.values).toMatchObject([authorId, status])
  })

  test('UPDATE users SET name = $1 WHERE id = $2', () => {
    const chain = UPDATE`users`.SET`name = ${'Alice'}`.WHERE`id = ${1}`

    const [sql, params] = chain.toSql()

    expect(sql).toBe('UPDATE users SET name = $1 WHERE id = $2')
    expect(params).toEqual(['Alice', 1])
  })

  test('WITH RECURSIVE tree AS (SELECT n.* FROM node n WHERE id = $...', () => {
    const chain = WITH_RECURSIVE`tree`.AS (
      SELECT`n.*`.FROM`node n`.WHERE`id = ${1}`.
      UNION``.
      SELECT`n.*`.FROM`node n, tree t`.WHERE`n.parent_id = t.id`
    ).
    SELECT`*`.FROM`tree`

    const [sql, params] = chain.toSql()

    expect(sql).toBe(
      `WITH RECURSIVE tree AS (
        SELECT n.* FROM node n WHERE id = $1
        UNION SELECT n.* FROM node n, tree t WHERE n.parent_id = t.id
      )
      SELECT * FROM tree`
      .replace(/\s\s+/g, ' ').replace('( ', '(').replace(' )', ')')
    )
    expect(params).toEqual([1])
  })

  describe('insert', () => {
    test('INSERT INTO "user" (name, email) VALUES ($1, $2)', () => {
      const chain = INSERT_INTO('"user"', { name: 'Alice', email: 'alice@example.com' })

      expect(chain.text).toBe('INSERT INTO "user" (name, email) VALUES ($1, $2)')
      expect(chain.values).toEqual(['Alice', 'alice@example.com'])
    })

    test('INSERT INTO "user" (name, email) VALUES ($1, $2) RETURNING id', () => {
      const chain = INSERT_INTO('"user"', { name: 'Alice', email: 'alice@example.com' }).RETURNING`id`

      expect(chain.text).toBe('INSERT INTO "user" (name, email) VALUES ($1, $2) RETURNING id')
      expect(chain.values).toEqual(['Alice', 'alice@example.com'])
    })

    test('INSERT INTO "user" (name, email) VALUES ($1, $2), ($3, $4)', () => {
      const chain = INSERT_INTO(
        '"user"',
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' }
      )

      expect(chain.text).toBe('INSERT INTO "user" (name, email) VALUES ($1, $2), ($3, $4)')
      expect(chain.values).toEqual(['Alice', 'alice@example.com', 'Bob', 'bob@example.com'])
    })
  })
})
