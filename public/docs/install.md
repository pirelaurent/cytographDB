# 🚀 Installation Guide

---

## 1️⃣ Clone the Repository

```bash
git clone git@github.com:pirelaurent/cytographDB.git
```

---

## 2️⃣ Node.js Setup

Node version must be >20  (was developed using **Node.js v20.9.0**).

### Install Dependencies

Install required packages listed in `package.json`:

```bash
npm install
```

If you encounter issues with your repository manager, reset the default registry, then retry. 

```bash
npm config set registry https://registry.npmjs.org/
```

---

## 3️⃣ Database Credentials

Create a `.env` file with your PostgreSQL access information. 
Can be done by copying ***.env.model*** into a .env 

```env
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=postgres
PGPORT=5432
```

Ensure your PostgreSQL server is **running and accessible**.

---

## 4️⃣ Start the HTTP Server

```bash
node server.js
```

---

## 5️⃣ Launch the App in Your Browser

Visit: [http://localhost:3000](http://localhost:3000)

---

## 6️⃣ Verify DB Connection

In the app menu, navigate to:

```
DB > Create graph from DB >
```

You should see the list of PostgreSQL databases.  
Choose one to generate its graph.

---

# 🧪 Optional: Install Demo Database `democytodb`

To test the app as this documentation, use the SQL scripts in `public/docs/sql`.

### Step 1: Create the Database

Run `create_demo_db.sql`:

```sql
-- Create the database
DROP DATABASE IF EXISTS democytodb;
CREATE DATABASE democytodb;
```

### Step 2: Initialize Schema

Run `init_demo_schema.sql` from the same directory.

[View sql source code](./sql/init_demo_schema.sql)

> The demo DB is empty, but CytographDB operates only on its schema structure.

---

- ⚪️ [Main](./main.md)
