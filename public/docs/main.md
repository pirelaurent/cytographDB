

# <img src ="./img/pep-inno2.png" style ="width : 40px;  vertical-align: top;" />CytographDB

CytographDB is a graphical browser that allows visual exploration of any data model present in a Postgres instance.

The name is derived from our use of the [Cytoscape JavaScript library](http://js.cytoscape.org/), which we thank for its open availability.


## Features

- Oriented network captured through PostgreSQL schema introspection
    - tables are *nodes*
    - foreign keys become directed *edges*


 <img src ="./img/aNetwork.png" style ="width : 400px;">   

By using selection and filtering capabilities on nodes and edges, leveraging both the visible and hidden layers, and traversing paths between nodes, a user can more easily:

- Visualize and navigate table dependencies  
- Distinguish logical or functional consistency domains  
- Identify and document business aggregates  
- Save and reload relevant business-level subsets to explain the model



#### [Quick tour ](./quickTour.md)
#### [Main menu Bar](./menuBar.md)
#### [Menu Nodes](./menuNodesSelectHide.md)
#### [Menu Edges](./menuEdgesSelectHide.md)



---

#### [getting started](./getttingStarted.md)

---