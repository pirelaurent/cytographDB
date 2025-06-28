# Quick Tour of the Demo Model

## Main Screen: Loaded `democytodb` Graph
A fake DB to work with several cases

![democytoscapedb](./img/democytoscapedb.png)

---

### How to obtain 

**DB → Create graph from DB**

- Show available PostgreSQL databases to work with.
- The demo database used here is `democytoscapedb` (empty by default). 
  - To generate it yourself, see the [Installation Guide](./install.md)



---

### Displayed Informations

![basicInformation](./img/basicInformations.png)


When cursor is over a node-table : 
- **Outgoing edges** (foreign keys) are green 
- **Incoming edges** (referenced by other tables) are red 
- if ***hover*** in upper menu bar is checked, a pop up show the number of edges **<-out & <-in**
- Unrelated elements are faded for clarity.

#### Aspect

- main tables (*Employee*, *Factory*)are rounded rectangles while association tables are circles.
  - A table with triggers shows one star per trigger. *Intervention* have two.
- edges are oriented from owner of a FK to the referenced table. 
  - the destination arrow is a triangle. 
- if a FK is a strong link with ON CASCADE DELETE option, le source arrow is a round circle. 
  - This is the general case on association table between two main tables as are *authorization* and *intervention* in the sample. 
- 

---

### Right-Click Node Menu

Right-click on a node to access its contextual menu:

![hoverMenu](./img/hoverMenu.png)

---

### Sample: Table Definition

![tableDefinition](./img/table-intervention.png)

About ON UPDATE ON DELETE see also [FK constraints explained](./moreSQL.md) 

---

### Table triggers 
This open a new page with triggers definitions and access to their codes :

![triggerDefinition](./img/trigger-intervention.png)


#### Impacted Tables

A code analysis of trigger and functions search for `UPDATE`, `DELETE`, or `CREATE` operations.
In the example below, the `employee` table was referenced via an `UPDATE` clause:

---

#### Trigger Code Details

![triggerDefinition](./img/function-intervention-code.png)

---

## Adding trigger Impacts in the Network

From the Edges menu:  
**Edges → Data Model → Generate Trigger Impact**

This adds new, specially styled edges to represent trigger-based relationships (violet below)
In this capture was added Edges-Label-Show for the two edges 

![triggerNetwork](./img/triggerNetwork.png)

In a large graph, select these particular edges:  
**Edges → Filter → `generated triggers`**  
*(Make sure to click through each step.)*

---

### Perimeter of actions 

The common rule is : 
- if nothing selected, action apply to all **visible** 
- if some selected, action apply only on **selected** 

A visual help to see the current perimeter: 
**Nodes** Selected/Visible *(hidden selected/total)*  .............. **Edges** selected/visible.  
- Perimeter : 7 nodes 12 edges 
![visible](./img/perimeterVisible.png) 
- Perimeter : 3 nodes 12 edges 
![selected](./img/perimeterSelected.png).


## common operations on graph 

### explore dependencies of a main table 

**Select** a table by any way ( by click, by name, by category, etc. ).  
to work in comfort, hide others : **nodes - hide - not selected** 


Walk the edges of this node : 
- Follow & show 
  - Outgoing to see the related tables this one is constraint by a FK 
  - Incoming to see which tables use this one 
  - Both to have eco-system around the table 
  
  #### Below **Follow Both** from production_line 

  <img src = ./img/followBoth.png width = 500px>

One can see that a depency through an association table give not enough information with a half part. 
- **Follow & show **
 - **Association** (node associations are already selected after *follow both* , otherwise select all )


  <img src = ./img/followAssociation.png width = 500px>

### document this exploration with a photo

At any time you can **make a *photo* of the graph** in a PNG format.

### keep a work in its current status 

At any time you can save the graph with all elements you have kept through ***File - Download*** 

This is useful to work with ready to use subgraph, for example per domain. 

## custom layout and category

A default layout apply on graph.  
A custom layout can be declared associated to one or more DB names.  
For democytodb example, tables with no FK like *product* or *company* , identified as **root table** are ***green triangle***. 

This custom category is directly available in a search by : 
***Nodes - Filter by***

  <img src = "./img/filterByCustom.png" width = "400px">

---
Go back to [**documentation**](./main.md) for more details 