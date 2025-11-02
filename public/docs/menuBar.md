# Menu Bar

![All Menus](./img/allMenus.png)

Menus and submenus appear on hover and disappear when the cursor leaves.  
💡 **Tip:** Click on a menu entry to keep it temporarily open.

---

## <img src ="../img/rollback2.png" height =20px/> Undo

The **counterclockwise arrow** restores the previous state of the graph after an action.  
You can also use the keyboard shortcut **Ctrl Z**.
Notice shortcut **Ctrl Y** can restore backward. 

---

## <img src ="../img/redCapture.png" height =25px/> PNG Snapshot

This button captures the current view and prompts you to download it as a PNG image.      
The edges are temporarily enhanced in the graph image so they are more visible when printing.      
You can also use the keyboard shortcut **Ctrl G** — useful for taking a snapshot without moving the mouse outside the graph.   

---
## <img src="../img/clipShort.png" height =30px/> <img src = "../img/clipFull.png" height =30px/> &nbsp; Clip Report

These icons show empty and filled in clipped data that echoes results of actions.    
A click will diplay the last clipped content in a new tab to quickly browse results.    .  


---

## 🔎 Select Mode: OR / AND  

- **OR (default):** Adds new elements to the current selection.
- **AND:** Applies the selection **only to already selected elements**, resulting in an AND operation.

💡 **Tip:** Switch back to **OR** after using **AND**, otherwise further selections may return no results.

--- 

## Hover Toggle 
<img src ="./img/hoverToggle.png" height =40px/>

Displays element details when the cursor hovers over nodes or edges.

---

### Perimeter of Actions

The status bar shows the current scope with highlighted numbers:

<img src ="./img/perimeterOfActions.png" width = "300px"/>

Tables - visible: selected elements:3 /all elements:10  (hidden: selected:0 / total hidden:0)  
Relations -  visible: selected elements:0 /all elements:12  (hidden selected:0 / total hidden:0)  

Actions are applied to current perimeter: 
- If some visible elements are **selected**, actions apply only to them.
- If no current selection, actions apply to the entire visible graph.

In the sample :    
A command on tables will apply to the 3 visible selected.   
A command on relations will apply to the 12 visible

---  

# Database Access 

## <img src= "./img/DBmenu.png">

The main purpose of **CytographDB** is to create a graph from an available PostgreSQL database.  
### <img src= "./img/createGraphMenu.png">

- A dropdown with all available databases is displayed.
- Choose one and click **OK** to generate the graph.


####  <img src="./img/connectToDBMenu.png"> 


---

# File Access 

## <img src="./img/filesMenu.png"> 


 



### Download 

At any time, a graph can be saved (download) in its current state as a JSON file. 

It save the graph to your ***local disk*** using the browser. 

#### Graph Name in main bar

<img src="./img/drafInput.png"> 


### Upload 

By default an upload will try to find and connect automatically the original DB used when dowloaded. 

#### compatible DB 

If this very DB is no more available, you can connect  a compatible one first:    
####  <img src="./img/connectToDBMenu.png" width="120"> 

Reloading your json, you will be prompted for a confirmation: 
  <img src= "./img/compatibility.png" width ="260px" style ="border:1px solid #888">     


**no database connection at all**:   
  
<img src= "./img/NoDetailsNoDB.png" width ="260px" style ="border:1px solid #888">  

### Default if no Database 

If no DB connected, somme actions will have errors or no effects: 

***Triggers list and code details***  
<img src = './img/DBErrorOnTriggers.png' width ="160" style="border: 1px solid grey;">

***Table details***  
<img src = './img/DBNoTabeDefinition.png' width ="400px" style="border: 1px solid grey;">


--- 

⚪️ [Main](./main.md)  

