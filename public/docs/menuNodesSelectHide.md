# Nodes Menu

<img src ="./img/nodesMenu.png" width =200px >

## Status Bar

Displays selected nodes on visible and hidden layers:  
<img src = "./img/nodeStatusBar.png" width = "200px">  

**0 selected / 10 available** in visible layer  
(0 selected / 0 available) in hidden layer  

The perimeter of actions applies to selected nodes if any, or to all nodes if no selection.  

---

## 🔍 Selection on Screen

Selections can be made by:  
- Clicking nodes individually  
  - Clicking outside any element removes the current selection  
- **Shift + Click** for multi-selection  
- Drawing a rectangle over nodes  

### Select ...

<img src ="./img/nodeSelect.png" width =150px >

- **None**: clear any selection  (also any click on graph background)
- **All**: select all visible nodes (also available with `Ctrl + A`)  
- **Swap selected**: invert the current selection (selected become unselected, and vice versa)  

### Hide ...

<img src ="./img/nodeHide.png" width =150px >  


- **Not selected**: hide everything except selected nodes  (most used option)
- **Selected**: hide selected nodes  
- **None**: show all nodes  
- **Swap**: swap visible and hidden nodes  

### From Selected Edges ...

<img src ="./img/nodeFromEdge.png" width =150px>

This menu works only with previously selected edges.  

- **select source nodes**: select nodes that are the origin of a selected directed edge (FK owner)  
- **both sides**: select all nodes connected in any manner to a selected edge  

- **select target nodes**: select nodes that are the destination of a selected directed edge  

💡 **Tip:** Example use case — filter edges by native category such as `"triggers generated"`.  
Then apply **From Selected Edges → Both Sides** to highlight a subgraph of source and impacted tables by triggers.  

### Filter By ...

<img src ='./img/filterByMenu.png' width= "150px" >

#### By Name

<img src ='./img/filterByName.png' width= "300px" >

Applies a **regex-based filter** on node labels (e.g., table names). Matching nodes are selected.  

⚠️ **Caution:** Some browsers may show text with autofill but not pass it to the regex.  
Enter manually or copy/paste your filter.  

#### By Native Category 

<img src ='./img/nodeNativeCategories.png' width= "150px" >  

Native categories are calculated at load time and are available to filter nodes with any database.  

- **Orphan**: isolated table, no outgoing or incoming edge  
- **Root**: table without outgoing edge (no FK), one or more incoming edges  
- **Leaf**: table without incoming edge (never referenced)  
- **Dry association**: association table with two links and no private column (MxN relation)  
- **All associations**: association tables with only outgoing edges  
- **Has triggers**: tables with triggers  

#### By Custom Category

Custom categories are added via custom logic. (@see [Customization Options](./customization.md))  

The filter automatically adapts to the list of custom categories. In `democytodb` there is only one:  
<img src = "./img/customCategory.png" width ="150px">  

This custom ***product*** category is created for demo by the `public/custom/democytodb.js` code:  

```js
if (node.data("label").includes("product")) node.addClass("product");
```

A specific layout `  selector: "node.product"`has also been defined in the custom extensions  


#### How to See Categories

Native and custom categories are displayed while hovering over the node (with *hover* option on):  
<img src = "./img/nativeAndCustomHover.png">  

---

### Select ... With Edges 

Select nodes based on their edge characteristics.  
<img src = "./img/nodeByEdges.png" width ="150px">  

- **None**: no edges on node (same as *filter by...native category... orphan*)  
- **Looping**: node has a self-referencing edge (hierarchical references)  
- **Outgoing**: condition on number of outgoing (FK) links  
- **Incoming**: condition on number of incoming links  

<img src = "./img/nodeByEdgesCount.png" width ="250px">  

💡 **Tip:** Combine **AND/OR** selections to find specific structures.  

<img src = "./img/and-or.png" width ="180px">  

Example: select *first nodes with 2 outgoing* → set **AND** → select *no incoming edges*.  
(This detects the same as the *Dry Association* category.)  

---

### Label 

<img src = "./img/labelNodes.png" width ="150px">  

- **Show**: default display with table name on node  
- **Hide**: no label (a single point). Node size is reduced to this point  

#### label hide 
Below, only *associations* were selected (*Filter by native category → All association*).  
***Label → Hide*** reduces them visually as small circles.  

<img src = "./img/labelHide.png" width = 300px>  

*(If no nodes are selected, the action applies to all visible nodes).*  

- **Font +/-**: increase or decrease the font size of node labels in the current perimeter

💡 **Tip:** Useful to emphasize certain parts of the graph.  

---

### List 

Generates an HTML file with all tables, sorted alphabetically.  
This applies to the current perimeter (selected nodes if any, all nodes otherwise).  

**All headers are sortable** by clicking on the header.  

<img src = "./img/listNodes.png" width = 360px style="border: 2px solid grey;">  

#### Chaining to Table Details 

Clic on a table name to open details :  
   <img src = "./img/detailsFromList.png" width ="800px" style="border: 2px solid grey;">  

Clicking on a trigger number opens its trigger definition.  
 <img src = "./img/triggersFromList.png" width ="600px">  

#### Close Button 

<img src = "./img/closeButton.png" width ="50px" >

Closes the current browser tab : that will return to main graph.  

💡 **Tip: don't forget to close tab**  
>If you don’t, a later call to the same named tab will update it as expected, it blinks BUT it will not come to front (standard security reasons).  
Don’t assume your action failed — check your tab list first. 

---

## Follow and Show

### <img src ='./img/nodeFollowAndShowMenu.png' width = "150px" >

These actions follow paths from current nodes visible perimeter and can bring hidden nodes back into view if they are linked.  

- **outgoing**,  **both**, **incoming**:  
  Start from selected nodes and follow edges in the chosen direction(s). Linked nodes are selected.  
  The operation can be repeated to show successive dependencies.  

- **Association**:  
  When a selected node is an association, reveal and select the nodes on the other side of the association regardless of direction.  

- **Long paths**:  
  From a selected node (mainly *leaf nodes*), find paths that involve three or more tables in successive **output direction**.  
  All paths are calculated and displayed.  

- **PK ← FK chains**:  
  Follows successive incoming edges from a root node **and** checks that the referencing table’s foreign key **fully covers** all columns of the referenced table’s primary key.  
  The walk continues as long as this pattern is correct.  

 [more details : *Quick Tour* → *Walk the model*](quickTour.md#walk-the-model).  

---

### Delete 

Permanently removes *selected nodes* from the graph.   

- If only one node is selected, deletion is immediate  
  - This allows quick visual cleaning of a graph using keyboard **Backspace**  or **delete**
- If several nodes are selected, a confirmation is shown:      

<img src = "./img/deleteNodes.png" width = 230px style="border: 2px solid grey;">   

💡 **Tip:** The same action can be performed using **Backspace**.  
💡 **Tip:** Use <img src ="../img/rollback2.png" height =20px/> **Undo** to restore an accidental deletion.  

---

- ⚪️ [Main](./main.md)  
- 🟩 [Quick Tour](./quickTour.md)  
- 🟨 [Main Menu Bar](./menuBar.md)  
- 🟦 [*Node Menu*](./menuNodesSelectHide.md)  
- 🟥 [Edge Menu](./menuEdgesSelectHide.md)  
