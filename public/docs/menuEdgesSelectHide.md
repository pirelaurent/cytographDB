# Edge Menu

![Edge Menu](./img/edgesMenu.png)

---

## 📊 Status

Displays selected and visible edges:  
Example: `(4 / 11)` → **4 selected / 11 total**

When some are selected, perimeter of actions applies to selection.  
When none are selected, perimeter of actions applies to all visibles.

---

## hover 

when checked, a mouse over shows some details
<img src = "./img/edgeHover.png" width = "500px">  

## 🔍 Select

Edges can be selected directly via:
- Click
- Shift + Click
- 

Selected edges have distinct dashed lines to be recognized 
<img src = "./img/edgeSelected.png" width = "400px">   

Menu options:

- **All** → Select all visible edges
- **None** → Deselect all edges
- **Swap Selected** → Invert current edge selection

---

## 🙈 Hide

- **None** → Show all edges
- **Not Selected** → Hide all except selected edges
- **Selected** → Hide selected edges
- **Swap** → Invert visible and hidden edges

--- 

## 🔗(Edges) of selected nodes 

Take in account currently selected nodes to pursuit with edge selection :

  - **All Edges** → Select all edges connected to selected nodes
  - **Outgoing Edges** → Select only edges going out of selected nodes
  - **Incoming Edges** → Select only incoming edges to selected nodes

💡Similar to ***Nodes > Follow & Show***, except this selects only the edges—**not** the terminal nodes.


  #### **Edges Between Selected Nodes** 
  
  Select edges connecting currently selected nodes :

<img src = "./img/edgeConnectingNodes.png" width = 500px>   


---

## 🏷️ Label Display

Toggle edge labels of current perimeter (all visibles or selected only)

- Displays the foreign key name (common edges) or the trigger name (trigger impact edges) 

- font + / -  : act on selected edges if any, otherwise on visibles

<img src="./img/edgeLabels.png" width="600px" />

---

## 📋 List Edges

Generates an HTML file listing edge details based on current scope:

<img src="./img/edgesList.png" width="500px" style="border: 1px solid grey;"/>

---

# 🧩 Data Model 

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