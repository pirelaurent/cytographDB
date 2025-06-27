# SQL 

## 

## `ON DELETE` / `ON UPDATE` Options in PostgreSQL foreign keys

When a **foreign key** (`FOREIGN KEY`) is defined in a table, you can specify how it should behave in case of **deletion** (`DELETE`) or **update** (`UPDATE`) of the referenced primary key.

Here are the possible options:

| Code | Action        | Description                                                                 |
|------|---------------|-----------------------------------------------------------------------------|
| `a`  | NO ACTION     | **Default**. Prevents the action if it violates referential integrity, but the check is deferred until the end of the statement. |
| `r`  | RESTRICT      | Immediately prevents delete/update if dependent rows exist.                |
| `c`  | CASCADE       | Automatically deletes or updates dependent rows.                           |
| `n`  | SET NULL      | Sets the foreign key columns to `NULL` in dependent rows.                  |
| `d`  | SET DEFAULT   | Replaces the foreign key with its default value in dependent rows.         |

### Examples:

```sql
-- Automatically delete a customer's orders when the customer is deleted
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE

-- Prevent deleting a customer if orders still reference them
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT

## 🆚 `RESTRICT` vs `NO ACTION` in PostgreSQL

### Both avoid a delete of parent if there is any child but with subtil differences

| Aspect                      | `RESTRICT`                                          | `NO ACTION`                                           |
|----------------------------|-----------------------------------------------------|--------------------------------------------------------|
| **Verification timing**    | Immediately, at the time of the statement           | At the end of the statement or transaction             |
| **DEFERRABLE support**     | ❌ Not deferrable                                   | ✅ Can be used with `DEFERRABLE INITIALLY DEFERRED`    |
| **Common use**             | Strict, instant constraint enforcement              | Allows for more flexible, transaction-level enforcement |
| **Behavior in multi-step transactions** | Fails early if child rows exist              | Allows changes if child rows are removed before commit |
| **Typical result**         | Same as `NO ACTION` if constraints are not deferred | Same as `RESTRICT` in most simple cases                |

## Consequences of `ON DELETE CASCADE` in PostgreSQL

Using `ON DELETE CASCADE` on a foreign key constraint means that when a row in the **parent table** is deleted, all related rows in the **child table** are **automatically deleted** as well.

### 🔄 What happens

- The deletion **propagates** from the parent table to all child tables with `ON DELETE CASCADE`.
- It can affect **multiple levels** if cascading constraints are defined transitively.

### ✅ Advantages

- Ensures **referential integrity** without manual cleanup.
- Reduces boilerplate code — no need to explicitly delete child rows.
- Useful when child rows are **logically owned** by the parent (e.g., orders owned by a customer).

### ⚠️ Risks and Considerations

- Deletion is **recursive**: if child tables themselves have `ON DELETE CASCADE`, this can lead to a **chain of deletions**.
- May result in **massive unintended deletions** if used carelessly.
- Harder to audit or log deletions, as they happen automatically.
- Can affect **performance** if many rows or large hierarchies are involved.

### 🧠 Best Practices

- Use `ON DELETE CASCADE` **only** when child data is not meaningful without the parent.
- Avoid it for weak relationships (e.g., logs, history) that may need to be preserved.
- Consider using `ON DELETE SET NULL` or `ON DELETE RESTRICT` for more control.

### 💡 Example

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE
);

-- Deleting a customer will automatically delete their orders
DELETE FROM customers WHERE id = 42;
``` 