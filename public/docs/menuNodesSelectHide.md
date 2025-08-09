# Nodes Menu

![Node Menu](./img/nodesMenu.png)

---

## 🔍 Select

Selections can be made by:
- Clicking nodes individually
- Shift + click for multi-selection
- Drawing a rectangle over nodes

#### Selection via Menu

- **select... all** → also available with `Ctrl + A`
- **select... none** → no selection. Quicker way : click on an empty space in the graph
- **select...swap selected** → invert the current selection (selected become unselected, and vice versa)

- **select... from selected Edges**: It uses the selected **edges** as the source of selection and select nodes that are connected to them. 

💡 **Use case sample**:  
Filter edges by native category like `"triggers generated"`, then use **From Selected Edges** to highlight all impacted nodes.

---

### <img src ='./img/hideMenu.png' >

- **none** → show all nodes 
- **not Selected** → Hide everything else
- **selected** → Hide selected nodes
- **swap** → Swap visible and hidden nodes


---

### <img src ='./img/followAndShowMenu.png' >

*(These actions search into visible and hidden nodes when following a path)*

Starts from currently selected nodes and follows the edges in choosen directions to reveal and select target nodes.   
- **outgoing**
- **incoming**
- **both**   
- **association** :  When a selected node is an association, reveal and select the other side nodes involved in this association.   
- **long paths** : From a selected node (mainly *leaf nodes*) find path that involve at least three tables in successive **output direction**.
- **N->1 chains** : This walk is limited to successive follow incoming steps starting from a *root node*, but it verifies that all primary key columns of the referenced table are included in the foreign key columns of the relying table.

See details at [quicktour *walk the model* ](quickTour.md#walk-the-model) 

---

### <img src ='./img/degreeMenu.png' >

Select nodes based on their connectivity:

- **None**
- **Looping** → Node has a self-referencing edge (hierarchical)
- **Outgoing** → Apply condition to nodes with outbound links
- **Incoming** → Same logic, for inbound links

💡 **Tip**: Combine with **AND/OR** selection to find specific structures.  
Example: *Select nodes with 2 outgoing AND no incoming edges* (useful to detect association tables).


---

### <img src ='./img/filterByMenu.png' >
- **filter by ...Name** → Regex-based filter on node labels (e.g., table names)
 <img src ='./img/filterByName.png' width= "250px" >


- **filter by ...native category** 
These categories are calculated at load time and are availble to filter nodes : 

  - **orphan** : isolated table, no outgoing, no incoming edge.
  - **root** : table without outgoing edge, one or more incoming edges (zero are *orphan*).
  - **leaf** : table without incoming edge. 
  - **dry association** : association tables with two links and no private column.
  - **all associations**: association tables with only output edges.
  - **has triggers** : tables with triggers.

- **filter by ... custom category** → Categories added via custom logic   
Within `democytodb.js` code creates a ***product*** category and add a specific layout (label is larger) for this category. 
Filter adapts automatically the list as one can see in the demo:
<img src = "./img/customCategory.png">.  

Native and custom categories are displayed while hovering the node with hover option : 
<img src = "./img/nativeAndCustomHover.png">.  


### <img src = "./img/labelNodes.png">.  

- **show** : default display 
- **hide** : anonymous label as a single point. Size of node reduced to the label size. 

As other actions, label actions are applied to current perimeter : all graph if no selected, selected only if any. 

Below, *associations* were selected before using *label hide*

<img src = "./img/labelHide.png" width = 300px>  

---

- **font +/-**

Increase or decrease font size of nodes labels in the current perimeter (all or selected)
Useful to enhance some parts, before a PNG snapshot for example. 


---

### <img src ='./img/listMenu.png' >

Generates an HTML file listing all node's labels, sorted alphabetically.
As other action, this one apply to current perimeter (selected nodes or all nodes if no selected)
<img src = "./img/listNodes.png" width = 400px style="border: 2px solid grey;">  
( remember ** indicates two triggers on **intervention**)

---

### <img src ='./img/deleteMenu.png' >

Permanently removes *selected nodes* from the graph.   
Same action is performed by *backspace*

- if only one node selected, delete is immediate 
  - this is to allow quick visual cleaning of a graph using backspace
- if several nodes selected a confirmation is necessary      
   
 <img src = "./img/deleteNodes.png" width = 230px style="border: 2px solid grey;">   


❗ Remember **Undo** is available for these actions as well

---

- ⚪️ [Main](./main.md)
- 🟩 [Quick Tour](./quickTour.md)  
- 🟨 [Main Menu Bar](./menuBar.md)  
- 🟦 [*Node Menu*](./menuNodesSelectHide.md)  
- 🟥 [Edge Menu](./menuEdgesSelectHide.md)  