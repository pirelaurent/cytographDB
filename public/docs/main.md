

# <img src ="./img/pep-inno2.png" style ="width : 40px;  vertical-align: top;" />CytographDB

## Features

- Generate a directed graph from a PostgreSQL schema using introspection:
    - Each table is a *node*
    - Each foreign key defines a directed *edge* between nodes

The graph supports large schemas and uses color-coded links to visualize table dependencies.

 <img src ="./img/aNetwork.png" style ="width : 500px;">   

By using selection and filtering capabilities on nodes and edges—leveraging both visible and hidden layers—and traversing paths between nodes, users can more easily:

- Visualize and navigate table dependencies  
- Distinguish logical or functional consistency domains 
- Identify and document business aggregates  
- Save and reload relevant business-level subsets to better explain the model



#### [Quick tour ](./quickTour.md)
#### [Main menu Bar](./menuBar.md)
#### [Menu Nodes](./menuNodesSelectHide.md)
#### [Menu Edges](./menuEdgesSelectHide.md)
--- 
#### [Customization](./customization.md)
--- 
#### [Installation](./install.md)