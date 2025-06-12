# Physical Data Model Visualizer

A Node.js-based web application to visualize physical database models using interactive graphs powered by [Cytoscape.js](https://js.cytoscape.org/). Tables are represented as nodes and foreign keys as links. Clicking a table opens detailed column information.

## Features

- Interactive graph of database tables and relationships
- PostgreSQL schema introspection
- Clickable nodes to explore table columns
- Responsive and minimal UI
- Easy to extend for other RDBMS

## Demo

![Graph Demo](docs/img/graphismeBase.png)  
*Example of a database model rendered with Cytoscape.js.*

## Installation

Download project through git 

### Prerequisites

- Node.js (v18+ recommended)
- A PostgreSQL database with accessible credentials
- An access to internet 

### Steps

```bash
git clone https://github.com/your-username/physical-data-model-visualizer.git
cd physical-data-model-visualizer
npm install
``` 

#### Run 

``` node server.js ```  
Sart you browser on*** https://localhost:3000***