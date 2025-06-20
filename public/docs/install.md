

# Installation 

## clone the repo 

 ``` bash
 git clone git@github.com:pirelaurent/cytographDB.git 
 ```
### node.js  

At redaction time, app was using node v20.9.0 

#### node packages

Install dependencies within **package.json**.

 ```bash 
 npm install 
 ```
In case of trouble with your owwn repository manager, go to the standard 

```bash
npm config set registry https://registry.npmjs.org/
``` 

### adapt database credentials  
#### .env file  for your installation.

``` bash
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=postgres
PGPORT=5432
```

## start http server

Your  **Postgres** server must be running and accessible.

``` bash
node server.js 
``` 

### external links in *index.html* 

Several links come from their own websites => **you need an internet connection.**

### see app in navigator 
  
```http://localhost:3000 ```

#### check connection

in menus  :  

```DB> create graph from db >```     

you must see the list of the DB installed in your postgreSQL. 

If you choose one, a grph will be constructed. 


# optional 

### install the documentation test base ***democytodb*** 

With your prefered POstgreSQL tools, apply the following scripts from ***public/docs/sql*** : 



If you want a test db, it can be created with the following scripts in sql directory: 

#### *create_demo_db.sql
``` sql
-- Create the database

DROP DATABASE IF EXISTS democytodb;
CREATE DATABASE democytodb;
``` 

#### init_demo_schema.sql*

[see source code](./sql/init_demo_schema.sql)

The DB is empty but cytographDB works on the schema.  
