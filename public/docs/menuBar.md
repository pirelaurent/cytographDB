# Menu Bar

![All Menus](./img/allMenus.png)

Menus and submenus appear on hover and disappear when the cursor leaves.  
💡 **Tip:** Click on a menu entry to keep it temporarily open.

---

## <img src ="../img/rollback2.png" height =20px/> Undo

The **counterclockwise symbol** in the menu restores the previous state.  
You can also use the keyboard shortcut **Ctrl + Z**.

---


## <img src ="../img/redCapture.png" height =25px/> PNG Snapshot

This button captures the current view of the graph and prompts you to download it as a PNG image.   
The edges are temporarily enhanced in the graph to be more visible when printing.   
You can also use the keyboard shortcut **Ctrl + g**. Useful to keep snapshot without moving mouse out of graph. 

---

## 🔎 Select Mode: OR / AND

- **OR (default):** Adds new selection to the current selection.
- **AND:** Applies the selection criteria **only to already selected elements** resulting in an AND operation.

💡 **Advice:** Switch back to **OR** after using **AND**, further selections may otherwise return no result.

--- 

## Hover toggle 

Displays element details when the cursor hovers over them.

---

## 🎯 Perimeter of actions

### Automatic Scope

- If some visible nodes are **selected**, actions apply only to them.
- If none, actions apply to the entire visible graph.

The current scope is displayed in the status bar, with emphasized numbers:

 **No selection** → action applies to all nodes (e.g., 9 in `democytodb`):  
  <img src= "./img/scope9.png" width = '200px'>

  **Selection of 4 nodes** → action applies only to those:  
  <img src= "./img/scope4.png" width = '200px'>

---

## <img src= "./img/DBmenu.png">

### <img src= "./img/createGraphMenu.png">

- Select a database from the dropdown.
- Click **OK** to generate the graph.

####  <img src="./img/connectToDBMenu.png"> 

Used when a json stored graph is reloaded from disk and come not from DB. 
To access **table details**, must reconnect to the **original or compatible database** used when the graph was created.
Without reconnection, you can have warning like : 
- `no connection to database. Connect first to the original DB`
- <img src = './img/DBErrorOnTriggers.png' width ="200px" style="border: 1px solid grey;">

---

## <img src="./img/filesMenu.png"> 

Used to save and load graph data in JSON format.

### Download / Upload

- Use the browser's file dialog to save/load graph from local disk. 

#### Graph Name Input
<img src="./img/drafInput.png"> 

You can assign a name to your graph before downloading ( can change also in navigator)

---

## <img src ="./img/displayMenu.png">


### <img src="./img/fitScreenMenu.png"> 

- **All :** zoom/unzoom to fit all the nodes.
- **Selected :** fit only selected nodes.

### <img src="./img/layoutMenu.png"> 

Applies layout algorithms to reorganize the current scope.

- A variety of algorithms are available.
- Some layouts may spread nodes out of screen.
  - use **fit screen**, **zoom**, or try a different layout.
- Layout results have a random part and can vary at each execution.

- layout applies to current perimeter ( all visible or only selected if any)

 **Undo (or ctrl z)** is supported to reverse to previous presentation.

### <img src="./img/moveMenu.png"> 

Native cytoscape action are available to mode nodes : 
- left clic and drag a single node manually.
- Dragging one of the selected nodes moves the entire selection.

#### resize ...

Expand or shrink the scoped graph in both directions.

#### align & distribute ...

- **align:** Arrange nodes along a common axis.
- **distribute:** Evenly space nodes between boundary elements.

#### rotate ...

- Rotates selected nodes by **15°** increments.
- Node labels remain **horizontally aligned**.
- Help to reduce label overlaps.

---


- ⚪️ [Main](./main.md)
- 🟩 [Quick Tour](./quickTour.md)  
- 🟨 [*Main Menu Bar*](./menuBar.md)  
- 🟦 [Node Menu](./menuNodes SelectHide.md)  
- 🟥 [Edge Menu](./menuEdgesSelectHide.md)   