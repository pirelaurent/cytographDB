# Edge Menu

![Edge Menu](./img/edgesMenu.png)

---

## 📊 status bar

Displays selected and visible edges: 
<img src = "./img/edgeStatusBar.png" width = "200px">
  **4 selected / 12 total**

Perimeter of actions applies to selection if any, to all edges if no selection.  

---

### hover on edge

when checked, mouse over an edge shows some details
<img src = "./img/edgeHover.png" width = "200px">  

## select ...

Edges can be selected
-  individually by:
  - Click 
  - Shift + Click 
- with nodes by drawing a rectangle (shift clic) on the graph 
  

Selected edges have distinct dashed and colored lines to be recognized 
<img src = "./img/edgeSelected.png" width = "300px">   

- **select ... all** → Select all visible edges
- **select ... none** → Deselect all edges
- **select ... swap Selected** → Invert current edge selection

---

## hide ...

- **hide ... none** → Show all edges
- **hide ... not selected** → Hide all except selected edges
- **hide ...selected** → Hide selected edges
- **hide ...swap** → Invert visible and hidden edges

--- 

## from selected nodes ... 

Take in account currently selected ***nodes*** to pursuit with edge selection :


  - **outgoing Edges** → Select only edges going out of selected nodes
  - **incoming Edges** → Select only incoming edges to selected nodes
  - **boths** → Select all edges connected to selected nodes
    - 💡Similar to ***Nodes > Follow & Show***, except this action selects only the edges—**not** the terminal nodes.


- **connecting two nodes (of the current selection)** 
  
  below three tables were selected, then the link that connect them (including loops)

<img src = "./img/edgeConnectingNodes.png" width = 300px>   

## toggle details N -> 1 

draw an edge **per column of FK**
<img src = "./img/edgePerColumns2.png" width = 500px>  

---

## Label

**show/hide** 
- Toggle edge labels of current perimeter (all visibles or selected edges only)
- Displays the foreign key name (common edges) or the trigger name (trigger impact edges) 
- font + / -  : act on edges in perimeter

<img src="./img/edgeLabels.png" width="600px" />

### label show *in 1->N edges per FK*

In this representation, there is one edge per column involved in FK.   
The *label show* action shows the corresponding columns on the line.  
As the graph could be very dense, you can restrict by selecting some edges before calling *show label*, like below 

<img src="./img/labelEdgesOneToN.png" width="600px" />

---

## List 

Generates an HTML file with edge details for edges in current perimeter

<img src="./img/edgesList.png" width="400px" style="border: 1px solid grey;"/>

### List *in 1 -> N detailed mode*
( truncated below to beginning)
<img src="./img/edgesListOneToNTruncated.png" width="400px" style="border: 1px solid grey;"/>

---

# Data Model 

Special functions for advanced structural modifications.


## 🔁 Generate Trigger Impacts

⚠️ Requires connection to the **original database** used to build the graph.

- Analyzes all triggers and function code
- Identifies C(R)UD operations that imply impacts on other tables
- Adds **oriented edges** from the trigger's source table to the impacted table
- Edges are styled distinctly

<img src="./img/triggerHover.png" width="400px" style="border: 1px solid grey;"/>

---

### 🔄 Collapse Associations

For **strict association tables** (2 foreign keys, no other link, no extra columns):

- Removes the association node
- Creates a **direct edge** between the linked tables (A → C)
- Edge is visually **non-oriented** (uses circles, not arrows)
- Internally, orientation still exists (for compatibility with Cytograph)

⚠️ **Caution** when using actions based on edge direction—these may not behave as expected with collapsed associations.

<img src="./img/collapseAssociations.png" width="500px" />

in upper image, *intervention* node is not collapsed due to the trigger impact added recently. It is no more a *strict association*. 

---

### ♻️ Restore Association

Restores the original association node between tables.  
Note: The exact screen position may be lost during restoration.

---

## 🧼 Filter

Select specific generated edge:

- **Generated Triggers**
- **Collapsed Associations**
- **On delete cascade**

#### Filter on delete cascade sample

Only the FK between *Factory* and *Company* is not selected 
<img src="./img/onDeleteCascadeEdge.png" width="500px" />

---

## 🗑️ Delete Selected

Permanently removes selected edges from the graph.  

- Direct deletion when a unique edge is selected. 
❗ **Undo** is available for this action as well


---

- ⚪️ [Main](./main.md)
- 🟩 [Quick Tour](./quickTour.md)  
- 🟨 [Main Menu Bar](./menuBar.md)  
- 🟦 [Node Menu](./menuNodesSelectHide.md)  
- 🟥 [Edge Menu](./menuEdgesSelectHide.md)  