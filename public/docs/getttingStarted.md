

# Getting Started

## http server

A http server is required to linked interactive parts to a postgres engine
- At the very beginning: 
  - connect a postgres database
  - ask meta model and create a network of tables and foreign keys
- later if useful 
  - ask details of table to show upon request
  - to browse this documentation along with the graph

### A node project

The project has some dependencies listed in **package.json**.
(Think about ```npm install``` to update your local configuration)

This is a *javascript module project* as set in package.json. 

Some necessary js files are loaded directly in html like : 
```  <script src="https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"></script>```   
=> you must have an internet access.  

### Starting the Server

#### .env file
Create a local .env file if none 

Check the configuration in the ***.env*** file for your installation :

```
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=postgres
PGPORT=5432
```

Your  **Postgres** server must be running and accessible.

#### starts app 

From a terminal in the project directory :***```node server.js```***
The application is available at ***localhost:3000***

#### demo 




