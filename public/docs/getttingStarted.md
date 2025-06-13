

# Getting Started

## http server

A http server is required to linked interactive parts to a postgreSQL engine. 
A mini server based on *express* is used in the project.  
- At the very beginning: 
  - it connects to a postgreSQL running database, 
  - question its meta model and create a network of tables and foreign keys
  - get details of tables to show upon request
  - get triggers information 
  - get details and analyze sql code 
  

### uses node.js  

The project has some dependencies listed in **package.json**.

Think about ```npm install``` to update your local configuration. 
Check your node version `node -v` and update according to dependencies (>20)

### kind of app

Despite file names in .js extension, this is a ***javascript module project*** as declared in package.json. 

### external code 

Some necessary js files are loaded directly in index.html as is the cytoscape core : 
```  <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>```   

=> you must have an internet access.  

### Starting the Server

#### .env file

Create a local .env file if you have none and if the defaults below don't apply to your configuration.  

Adapt the configuration in the ***.env*** file for your installation.

```
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=postgres
PGPORT=5432
```



#### starts app 

Your  **Postgres** server must be running and accessible.

From a terminal in the project directory, run:  ***node server.js***
The application is available at **localhost:3000** in a navigator

####  optional ***democytodb*** 
For documentation purposes a fake DB was used. 
If you want a test db, it can be created with the following scripts in sql directory: 
*create_demo_db.sql
init_demo_schema.sql*




