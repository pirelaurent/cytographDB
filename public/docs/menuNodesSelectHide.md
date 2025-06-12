# Menu Nodes

## Select 

A native capability of cytoscape. 
A selection can be done by hand by click, shift-click or a drawn rectangle.
Select all can also be done by *ctrl-a*
Slect none can also be done by click a free place in the graph

A selection can be done by retrieving ***the nodes connected to the selected edges*** .

### status 
In the node main menu are displayed informations about selected and hidden nodes  
***Noodes  Selected/Visibles ( selected/hidden)*** 

## Degree

Degree is about selection depending of number of edges connected to a node. 
***None/looping/outgoing/incoming*** can be used to target some nodes, ie some tables of DB. 
For example, to target nodes with exactly 1 outgoing AND 1 incoming , use the select OR/AND box in main menu.  
This selection will typically catch the simple association nodes (2fk). 

## Filter

Select nodes with extra properties : through a regex on the label ( name of a table )
Select nodes with dynamic added category : ***must click on  "by category >"*** to retrieve available categories before a choice. 

## Hide 

obvious. 

## Follow & show 

Select other nodes that are linked to currently selected nodes (on or several).
It search in the current scope that depends of the option *acts on Visible/all* 
With ***all***, if a dependant node is found in hidden, it is automatically ***shown*** in the visible graph. 

## Aspect

some options to change the presentation. try it. 

## List 

create an html file with the names of nodes for commodity

## delete selected 

remove definitively the nodes from the graph.

----
