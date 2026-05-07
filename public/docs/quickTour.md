# Quick Tour

**Using the *democytodb* Model**

---

## democytodb

This **simple database model** was designed **for documentation purposes**.
To create **democytodb** in your PostgreSQL instance, see the [Installation Guide](./install.md)

---

## Initial Load of Sample *democytodb*

<img src="./img/democytoscapedb2.png" width="600px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

---

# General UI

## Main Menu Entries

- **Display**: All **visual customization** options
- **Tables**: Browse, select, and **manage table visibility**
- **Relations**: Browse, select, and **manage relationship visibility**
- **Model**: Other **global analysis** actions using the metamodel

---

## Basic Selections

- Click an **element** (node or edge) to select it
- **Shift+Click** an element to **toggle its selection**
- **Shift+Click** to **add/remove elements** from the current selection

---

# Node = Table Representation

*(All UI choices can be **customized later per database*)*

### Table Shapes

| Shape | Icon | Description | Example |
|-------|------|-------------|---------|
| **Orphan** | <img src="./img/shapeOrphan.png" height="20" style="display: inline-block; vertical-align: middle;"/> | No links | *parameters* |
| **Leaf** | <img src="./img/shapeLeafNew.png" height="20" style="display: inline-block; vertical-align: middle;"/> | No outgoing links | *product, company* |
| **Root** | <img src="./img/shapeRootNew.png" height="25" style="display: inline-block; vertical-align: middle;"/> | No incoming edges (but not an association) | *skills* |
| **Dry Association** | <img src="./img/shapeDry.png" height="20" style="display: inline-block; vertical-align: middle;"/> | No incomings, 2 outgoings, FK columns = table columns | *authorization* |
| **Multi-Association** | <img src="./img/shapeMulti.png" height="20" style="display: inline-block; vertical-align: middle;"/> | No incomings, >2 outgoings **or** 2 outgoings with extra columns | *intervention* |
| **Default** | <img src="./img/shapeDefault.png" height="20" style="display: inline-block; vertical-align: middle;"/> | Standard shape | *production_line, factory, employee* |

---

### Trigger Detected Icon

<img src="../img/trigger2.png" width="25" style="display: block; margin: 0 auto;"/>
This symbol appears **under a node's label** when its table **has triggers** *(replaces previously used stars)*

---

# Hover on a Table

When the mouse cursor **hovers over a node**, its **direct neighbors** are highlighted:
- **Outgoing edges** (FKs) turn **green**
- **Incoming edges** (references) turn **red**

**Additionally**: With **hover enabled** in the main menu bar, a **detail popup** appears near the node:

With:
- **Number of outgoing edges (←out)**
- **Number of incoming edges (←in)**

<img src="./img/hoverBasicInformationNode.png" height="200px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

With:
- **Number of triggers** (if any)
- **Other categories** (if any)

<img src="./img/hoverInfo.png" width="300px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

💡 **Tip**: At any time, **Ctrl+G** or the **photo icon** captures the current screen as a **PNG snapshot**.

---

# Graphical Oriented Edge Lines

**Foreign Keys (FKs)**: Directed from **owner (child table)** to **referenced table (parent table)**

| Type | Description | Appearance |
|------|-------------|------------|
| **Standard FK** | Straight line with a **triangle arrowhead** at the destination | <img src="./img/edgeSimple.png" width="200px" style="display: inline-block; vertical-align: middle;"/> |
| **FK with ON DELETE CASCADE** | Standard FK **with a circle at the source** | <img src="./img/edgeCascade.png" width="200px" style="display: inline-block; vertical-align: middle;"/> |
| **Nullable FK** | **Special line color** (default: light blue) | <img src="./img/edgeNullable.png" width="100px" style="display: inline-block; vertical-align: middle;"/> |

---

### Hover on Relations

With **hover enabled** in the main menu bar, a **popup appears** when the mouse hovers over an edge:

- **Source table → Destination table**
- **FK name**
- **[Standard and custom categories]** (if any)

<img src="./img/hoverEdgeInfo.png" width="450px" style="display: block; margin: 0 auto; border: 1px solid grey;">

**`1/FK` or `1/Col`** indicates the **current edge display mode** (global or detailed). See **Edge Menu**.

---

### ⚠️ Warning About Root & Leaf in Directed Graphs

In a **directed graph**:
- **Root**: Node **without incoming edges**
- **Leaf**: Node **without outgoing edges**

For FKs, **least dependent tables** have **no FKs** (i.e., **leaves** in the graph).
⚠️ **For exports, start from leaves** (which are **roots** in export terms).

---

# More on Tables

---

## List of Tables

**List** generates a window with nodes from the **current perimeter** (*all visible nodes if none selected, otherwise only selected nodes*).

<img src="./img/listNodes.png" width="380px" style="display: block; margin: 0 auto; border: 2px solid grey;"/>

- **All columns are sortable** (click headers)
- **Checkboxes reflect and update selection**
- **Table names link to their detailed definitions**
- **Trigger counts link to trigger definitions**

<img src="./img/markdownSymbols.png" width="100px" style="display: block; margin: 0 auto;"/> **These actions are available for all tables**:

- **Download** as Markdown
- **Download** as Excel
- **Copy** to clipboard as Markdown

---

## Accessing Table Definitions

- Click a **table name** in any list (nodes or edges)
- **Right-click** a node and select **Table Definition** from the context menu

<img src="./img/contextualNodeMenu.png" width="160px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

The icons are **propagation commands** for the selected node.
They are **detailed in *Walk Through the Model*** when applied to collections.

---

### Definition: Display Details of the Selected Table

A new tab opens in the browser, showing **detailed schema information**:
- If any comment exists in the schema, a tooltip is available
- Indexes **exclude the Primary Key (PK)**
- The list of constraints (if any) **excludes PKs and indexes**
  - *Unique* or *Exclude* constraints are listed if any

**Total constraints in DB = PK + Indexes + Constraints**

<img src="./img/tableDetails.png" width="100%" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

**● Not nullable / ○ Nullable**: Short representation (used for columns and FKs)

<img src="../img/commentIcon.png" height="20px" style="display: inline-block; vertical-align: middle;"/> **DB Comment Icon**
Indicates a **database comment** (visible on hover).

<img src="../img/select/eyeOpen.png" height="20px" style="display: inline-block; vertical-align: middle;"/> **Preview Icon**
Displays the **first 10 records** in a new page.

---

### Triggers Entry

A new tab opens with the **trigger list**, allowing you to **browse the SQL code**.

<img src="./img/triggerMainPage.png" width="600px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

---

### Impacted Tables

**Automatic code analysis** searches for `UPDATE`, `DELETE`, or `CREATE` operations in **triggers and functions**.

In the example above, the `employee` table appears in **Impacted Tables** because an `UPDATE employee` was found in the trigger code.

⚠️ **Note**: To **visually link** source tables to impacted tables, generate edges via:
**Edges > Data Model > Generate > Trigger Impacts**

---

### Recursive Analysis

- If a trigger calls a function, **its code is also parsed**
- If a function calls another function, **that code is parsed too**
- **Already-analyzed functions are skipped** to avoid duplicates
- **Recursion limit**: 16 levels (prevents infinite loops)

---

### ⚠️ Limitations

- **Missing functions**: Some named functions may not be found
- **Dynamic SQL**: `EXECUTE someString` is **not analyzed** (content is uncertain)

---

### Warnings in Analysis

If you work with a **model subset** and impacted tables involve **missing parts**, you may see many warnings.
The warning window **truncates the list**, but **the full list is always copied to clipboard**, ready to paste:

<img src="./img/moreInClipboard.png" height="40" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

---

### Sample of Code View

CytographDB uses **SQL syntax highlighting** (via a third-party library).

<img src="./img/function-intervention-code.png" width="500px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

---

# More on Relations (Edges)

## List of Edges (Foreign Keys / Trigger Impacts)

**List** generates a window with edges from the **current perimeter** (*all edges if none selected, otherwise only selected edges*).

<img src="./img/edgeList1perCol.png" width="650px" style="display: block; margin: 0 auto;"/>

- **FK Name**: For **trigger impact edges**, this is the **trigger name**
- **Details**: In **detailed mode**, shows **column-to-column matching**
  In **non-detailed mode**, this column is **empty** (`-`)

---

## Menu Relations and Foreign Key Details

<img src="./img/rawFKOptions.png" width="400" style="display: block; margin: 0 auto;"/>

- **Raw FK** (Default): One edge **per FK** (one FK = one edge)
- **Per Column**: One edge **per matching column pair**

The labels below were displayed after selecting some relations and applying:
**Display > Relations Labels > Relation Name**.

<img src="./img/edgePerColumn.png" width="600px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

💡 **Tip**: You can also **toggle FK mode** (or label view) **per edge** via the **right-click context menu**:
<img src="./img/edgeFlipFlop.png" width="200px" style="display: block; margin: 0 auto;"/>

---

## Triggers... Generate Impacts

<img src="./img/menuTriggers.png" width="350px" style="display: block; margin: 0 auto;"/>

**New edges** represent **trigger-based relationships** (violet in the example below):

<img src="./img/triggerNetwork.png" width="350px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

- **Trigger impact edge labels** use the **trigger's name**
- You can **remove them** from the graph **the same way** as regular edges

---

# Walk Through the Model

This **directed graph** allows you to **traverse table dependencies**.

<img src="./img/menuFollowReveal.png" width="280px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

From **selected nodes**, you can **navigate in any direction** to **select neighbors**.

| Icon | Action | Description |
|------|--------|-------------|
| <img src="./img/stepByStep.png" width="100px" style="display: inline-block; vertical-align: middle; border: 1px solid grey;"/> | **Step-by-Step** | Navigate **one hop at a time** in any direction (*Outgoing / Both / Incoming*) |
| <img src="./img/treeByTree.png" width="100px" style="display: inline-block; vertical-align: middle; border: 1px solid grey;"/> | **Automatic Tree Propagation** | **Recursively** follows relations in the chosen direction (*Outgoing / Both / Incoming*) |
| <img src="./img/crossAssociation.png" width="100px" style="display: inline-block; vertical-align: middle; border: 1px solid grey;"/> | **Cross Association** | If a selected node is an **association**, **selects both sides** (regardless of direction). **Allows crossing the association boundary** |

**Follow & Reveal**: If neighbors are **hidden**, they are **automatically restored** to visible.

---

### Example

Starting with **production_line** as the only visible node:
- A **first Outgoing click** restores **factory**
- A **third Outgoing click** restores **company**

<img src="./img/followOut0.png" height="80" style="display: inline-block; vertical-align: middle;"/><img src="./img/followOut1.png" height="100" style="display: inline-block; vertical-align: middle;"/><img src="./img/followOut2.png" height="90" style="display: inline-block; vertical-align: middle;"/>

---

### Exploring Chains Backward

**Starting from *company* (selected)**:
- **Step-by-step**: Apply **Nodes > Follow & Show > Incoming** repeatedly
- **All at once**: Use **Incoming Tree Propagation**

You can see **backward dependencies** as selected nodes (example below uses **Dagre layout**):

<img src='./img/backwardDependency.png' width="500" style="display: block; margin: 0 auto;"/>

**Note**: The *product* table is **not in the graph** because **no directed edge links to it as incoming**.
The *line_product* **association acts as a barrier** (use **Cross Association** to jump over it).

---

### Other Propagations in Model Menu

<img src='./img/otherPropagations.png' width="400" style="display: block; margin: 0 auto;"/>

These options are **detailed in the [Model Menu](./menuModelDoc.md)**.

---

- ⚪️ [Main](./main.md)
