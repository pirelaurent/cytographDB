
# Menu Bar

![all menus](./img/allMenus.png)


*Menus and submenus appear on hover and disappear when cursor leaves.
(Better to click on each entry to fix them temporarily.)*

#### Undo symbol

the ***counterclockwise symbol*** in menu restore a previous state. *Ctrl-z* is a keyboard shortcut.

#### Select OR / AND

A new selection is combined with a previous as OR or AND operations.   
Start with an OR ((default) selection then AND with a new one. Think about to restore OR.  

### Scope of actions 

#### acts on 

 target only visible elements or all, including hidden. 

 #### automatic scoping 

- if *selected nodes* actions apply to the selection 
- if no selection, actions target whole graph (according to *acts on*)
--- 

#### DB

#### create graph from DB
  - choose a  DB in select box and construction of graph will start. 

#### connect to DB only 

  - establish a connection with a choosen DB (select box) 
  - used to access to details (table definition, triggers) of a reloaded json file. 
    - be aware of connecting to the DB used when graph was created

--- 

### Files 

Used to save graph as a json document

#### Upload /  Download

- through Navigator 

 
#### load / save /pick 
  - exchange with the server.
  - Pick  : show the list of saved files . Pick one to be loaded. 

#### Input box '*Graph Name*' 

give here a filename to load or to be saved. 
Enter name **before** calling a file  option. 

--- 

### Display 

#### fit screen

 organize the view around whole graph or only around selected nodes.

#### layout >

Collection of algorithms to self organize nodes and edges.  
Successive calls can give different results on cose layout. 
better to try.

#### move >

  You can drag a single node with the mouse.
  You can drag the set of selected nodes by moving an element.

##### Resize >

Allow to expand or contract the scoped graph in the two directions. 

##### Align and Distribute >

organize nodes on a same axis.
distribute equally the space betwween extremes 

##### rotate >

Rotates the selection (or all nodes if none selected) by 15°.
Labels allways remain horizontally oriented.

### style >

a graph is stored with its own style in the json file and reloaded uses the same. 
If you want to apply the last current style on old graph, use this option.   

---


