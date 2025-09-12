

<!--======================================================================================
                IF YOU SEE THIS MESSAGE :

You must use a Markdown Viewer plug-in in your navigator to browse this documentation. 

note: ***Markdown Viewer 5.3*** was used for development.*

=======================================================================================-->



# <img src="./img/pep-inno2.png" style="width: 40px; vertical-align: top;" /> CytographDB

## Overview

CytographDB is designed to help you browse and analyze a PostgreSQL physical schema through an interactive, directed graph.

After performing an automatic database introspection:

- Each **table** is a **node**
  - label of node is the table name 
- Each **foreign key** is a **directed edge** from source table (FK's owner) 
  - label of edge is the name of the fk.

This graph-based representation supports large and complex schemas, with color-coded links that enhance the visibility of table relationships.

<img src="./img/aNetwork.png" style="width: 500px;">

With powerful selection, filtering, and path traversal features—spanning both visible and hidden graph layers—CytographDB helps users to:

- Navigate graphically the model 
- Browse schema details with columns, index and foreign keys
- browse triggers code and identify impacts
- Identify logical and functional consistency domains  
- Save subgraphs to communicate the model effectively

---

## Documentation
- ⚪️ [*Main*](./main.md)
- 🟩 [Quick Tour](./quickTour.md)  
- 🟨 [Main Menu Bar](./menuBar.md)  
- 🟦 [Node Menu](./menuNodesSelectHide.md)  
- 🟥 [Edge Menu](./menuEdgesSelectHide.md)  

---

## Configuration

- 🎨 [Customization Options](./customization.md)  
- ⚙️ [Installation Guide](./install.md)  
