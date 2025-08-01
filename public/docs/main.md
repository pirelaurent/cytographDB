# <img src="./img/pep-inno2.png" style="width: 40px; vertical-align: top;" /> CytographDB

## Overview

CytographDB is designed to help you browse and analyze a PostgreSQL physical schema through an interactive, directed graph.

After performing an automatic database introspection:

- Each **table** is represented as a **node**
- Each **foreign key** is rendered as a **directed edge** connecting the corresponding nodes

This graph-based representation supports large and complex schemas, with color-coded links that enhance the visibility of table relationships.

<img src="./img/aNetwork.png" style="width: 500px;">

With powerful selection, filtering, and path traversal features—spanning both visible and hidden graph layers—CytographDB helps users to:

- Visualize and explore table dependencies  
- Identify logical and functional consistency domains  
- Detect and document business aggregates  
- Save and reload business-relevant subsets to communicate the model effectively

---

## Documentation
- ⚪️ [Main](./main.md)
- 🟩 [Quick Tour](./quickTour.md)  
- 🟨 [Main Menu Bar](./menuBar.md)  
- 🟦 [Node Menu](./menuNodesSelectHide.md)  
- 🟥 [Edge Menu](./menuEdgesSelectHide.md)  

---

## Configuration

- 🎨 [Customization Options](./customization.md)  
- ⚙️ [Installation Guide](./install.md)  
