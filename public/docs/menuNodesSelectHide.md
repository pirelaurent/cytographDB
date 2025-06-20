# Menu Nodes


![MenuNodes](./img/nodesMenu.png)

##### Label Nodes menu
Numbers 0/9 (0/0) represent ***Selected / Visibles  (selected/hidden)*** 

## Select 

A selection can be done on screen  by click, shift-click or a drawn rectangle.  
With menu : 

Select ***all*** can also be done by *ctrl-a*
Select ***none*** can also be done by clicking a free place in the graph
***swap*** inverse selected nodes   

##### from selected edges 

![menuSelectedFromEdges](./img/fromSelectedEdges.png)

Select the nodes that are connected to selected edges. 

##### subgraph of triggers impacts 

One case is to select edges by a filter: *native category "triggers generated"*  then use here *from selected edges* to have the subgraph of triggers impacts. 



## Degree

Degree is about selection relative to number of edges connected to a node. 

- ***None***
- ***looping*** a node reference itself. It is a hierarchy .
- ***outgoing*** can select condition to aim nodes 
- ***incoming*** the same for incoming 

A typical use case for the OR/AND select menu : *select nodes with 2 outgoing AND no incoming* aims association 
 

## Filter by 

- ***name*** : select by applying a regex on the nodes labels 
- ***native category*** : Native categories are defined by the application like ***'has triggers'*** 
- ***custom category*** : category defined by custom modules like *democytodb.js* that define*** root table*** (no outgoing)

Select nodes with extra properties : through a regex on the label ( name of a table )
Select nodes with dynamic added category : ***must click on  "by category >"*** to retrieve available categories before a choice. 

## Hide 

- none
- selected
- not selected 
- ***swap*** : exchange visible and hidden. 

## Follow & show 

- outgoing
- incoming 
- both 

Starting form selected node(s)  follow  the selected directions and select linked nodes.   

#### scope 

The search is done in he current scope , by default on visible.   
Extending the scope with *all* will follow links also in hidden part.  
if linked nodes are found they are brought back to the visible plan.  
This is a convenient way to find all dependencies of an isolated table in visible.    

#### label name
will apply to current scope.   
- dot  : label become a dot reducing the shape of the node as a small circle, clearing the space. 
- full name : restablish the standard 
#### label font 
Increase or decrease the font of current scope.  
Useful to promote some selected nodes.  

## List 

create an html file with the names of nodes sorted by label.

## delete selected 

remove definitively the selected nodes from the graph.
for more than one node a confirmation is needed.   

Undo wil work on delete also.  

----
