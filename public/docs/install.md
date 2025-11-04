# Installation Guide

---

## 1️⃣ Clone the Repository

```bash
git clone git@github.com:pirelaurent/cytographDB.git
```

---

## 2️⃣ Node.js Setup

Node version must be >20  (was developed first using **Node.js v20.9.0**).

### Install Dependencies

Install required packages listed in `package.json`:

```bash
npm install
```

Note: **for new version** think about restarting *npm install*



If you encounter issues with your repository manager, reset the default registry, then retry. 
```bash
npm config set registry https://registry.npmjs.org/
```     

## 3️⃣ Database Credentials

Create a `.env` file with your PostgreSQL access information. 
Can be done first by copying ***.env.model*** into a ***.env*** 
note : *.env* is not saved by git.

```env
PGUSER=postgres
PGHOST=localhost
# database will be proposed in app 
PGPASSWORD=postgres
PGPORT=5432
# port to run the cytograph server
CYTOGRAPHPORT=3000
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

You should see the list of available PostgreSQL databases.  
Choose one DB to generate its graph.

---

# Documentation : Markdown format  

Install a **markdown plug-in in your navigator** as documentation is in Markdown language. 

This development has used ***Markdown Viewer 5.2***  with the options 
- *Theme - github* *AUTO*   (for wide tables if any, change to a larger option )
- *Advances Options* - *Site Access* - ***http://localhost:3000*** (adapt to your port value)


---  

## Optional

### Install Demo Database `democytodb`

#### Step 1: Create the Database

Run `create_demo_db.sql`:

```sql
-- Create the database
DROP DATABASE IF EXISTS democytodb;
CREATE DATABASE democytodb;
```

#### Step 2: Initialize Schema

Take source and Run `init_demo_schema.sql` from the same directory.

> Notice that the demo DB is empty. CytographDB operates only on its schema structure.

####  Note: the corresponding SQL scripts are in `public/docs/sql`.
---

- ⚪️ [Main](./main.md)
