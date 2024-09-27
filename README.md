# pg-chain

Chainable methods to build SQL queries for Postgres in Node.js.

# Usage

Install the package from npm.

```
npm install pg-chain
```

Import a chainable method from `pg-chain`.

```js
import { SELECT } from 'pg-chain'
```

Most methods work as [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates).
They return an object that has various other methods that can be chained together to form SQL queries.

```js
const chain = SELECT`id, name`.FROM`users`
```

After all desired methods are called, we can use the `.toSql()` method to generate the SQL query.

```js
const [sql, params] = chain.toSql()
```

# Examples

* [SELECT](#select)
* [INSERT](#insert)
* [UPDATE](#update)
* [DELETE](#delete)
* [EXISTS](#exists)
* [WITH RECURSIVE](#with-recursive)

## SELECT

An example using `SELECT`, `FROM` and `WHERE` keywords.

```js
import { SELECT } from 'pg-chain'

const chain =
  SELECT`id, name`.
  FROM`users`.
  WHERE`id = ${10}`

const [sql, params] = chain.toSql()
```

Generated SQL:

```sql
SELECT id, name FROM users WHERE id = $1
```

Generated params:

```js
[10]
```

## INSERT

```js
import { INSERT_INTO } from 'pg-chain'

const chain =
  INSERT_INTO`users (name, status)`.
  VALUES('Alice', 'active').
  RETURNING`id`
```

Generated SQL:

```sql
INSERT INTO users (name, status) VALUES ($1, $2) RETURNING id
```

Generated params:

```js
['Alice', 'active']
```

## UPDATE

```js
import { UPDATE } FROM 'pg-chain'

const chain = UPDATE`users`.SET`name = ${'Alice'}`.WHERE`id = ${1}`
```

Generated SQL:

```sql
UPDATE users SET name = $1 WHERE id = $2
```

Generated params:

```js
['Alice', 1]
```

## DELETE

```js
import { DELETE_FROM } FROM 'pg-chain'

const chain = DELETE_FROM`users`.WHERE`id = ${1}`
```

Generated SQL:

```sql
DELETE FROM users WHERE id = $1
```

Generated params:

```js
[1]
```

## EXISTS

Note that in this example the `EXISTS` method is **NOT** called using tagged templates. In this case, parenthesis are added to the generated SQL.

```js
import { SELECT, EXISTS } from 'pg-chain'

const chain =
  SELECT`id, name`.
    FROM`users`.
   WHERE`status = 'active'`.
     AND`${EXISTS(
            SELECT`*`.FROM`posts`.WHERE`user_id = users.id`
          )}`
```

Generated SQL, indented for better visualization. The actual generated SQL does not contain line breaks.

```sql
SELECT id, name
  FROM users
 WHERE status = 'active'
   AND EXISTS (SELECT * FROM posts WHERE user_id = users.id)
```

## WITH RECURSIVE

A more complex example using a [recursive query](https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-RECURSIVE).

Note that in this example the `AS` method is **NOT** called using tagged templates. In this case, parenthesis are added to the generated SQL.

```js
import { WITH_RECURSIVE, SELECT } from 'pg-chain'

const chain =
  WITH_RECURSIVE`tree`.AS (
    SELECT`n.*`.FROM`node n`.WHERE`id = ${10}`.
    UNION.
    SELECT`n.*`.FROM`node n, tree t`.WHERE`n.parent_id = t.id`
  ).
  SELECT`*`.FROM`tree`
```

Generated SQL, indented for better visualization. The actual generated SQL does not contain line breaks.

```sql
WITH RECURSIVE tree AS (
  SELECT n.* FROM node n WHERE id = $1
  UNION
  SELECT n.* FROM node n, tree t WHERE n.parent_id = t.id
)
```

Generated params:

```js
[10]
```
