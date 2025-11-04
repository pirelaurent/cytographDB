

<!--======================================================================================
                IF YOU SEE THIS MESSAGE :

You must use a Markdown Viewer plug-in in your navigator to browse this documentation. 

 ***Markdown Viewer 5.3*** was used for development.*

See install.md file 
=======================================================================================-->



# <img src="./img/pep-inno2.png" style="width: 40px; vertical-align: top;" /> CytographDB

## Overview

CytographDB is designed to help you browse, analyze and enhance your PostgreSQL physical schema through an interactive, directed graph.

After performing an automatic database introspection:

- Each **table** is a **node**
  - label of node is the table name. 
- Each **foreign key** is a **directed edge** from source table (FK's owner) 
  - label of edge is the name of the fk.

This graph-based representation supports large and complex schemas, with color-coded links that enhance the visibility of tables relationships (in-out).

<img src="./img/aNetwork.png" style="width: 400px;">

With powerful selection, filtering, and path traversal features—spanning both visible and hidden graph layers—CytographDB helps users to:

- Navigate graphically the model  
  - organize domain subset and dependencies graphs 
- Browse schema details with columns, index and foreign keys
  - exported on demand in markdown for your own documentation 
- browse triggers code and identify impacts
  - add visual links for impacts between tables
- Identify logical and functional consistency domains  
- Save/load json subgraphs to work easily on subsets and save current work.

---

## Documentation
- ⚪️ [*Main*](./main.md)
- 🟩 [Quick Tour](./quickTour.md#quick-tour)   
- 🟨 [Main Menu Bar](./menuBar.md#menu-bar)  
- 🟨 [Display Menu ](./menuDisplay.md#menu-display)  
- 🟨 [Table Menu](./menuNodesSelectHide.md#menu-tables)       
- 🟨 [Relation Menu](./menuEdgesSelectHide.md#menu-relations)  
- 🟨 [Model Menu](./menuModelDoc.md#menu-model)

---

## Configuration informations

- ⚙️ [Installation Guide](./install.md)  
- 🎨 [Customization Options](./customization.md)  

