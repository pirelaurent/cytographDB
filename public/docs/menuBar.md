# Menu Bar

<img src="./img/allMenus.png" width="800px" style="display: block; margin: 0 auto;"/>

Menus and submenus appear on hover and disappear when the cursor leaves.
💡 **Tip:** Click a menu entry to keep it temporarily open.

---

## <img src="../img/rollback2.png" height="20px" style="display: inline-block; vertical-align: middle;"/> Undo

The **counterclockwise arrow** restores the previous state of the graph after an action.
You can also use the keyboard shortcut **Ctrl+Z**.
Note: **Ctrl+Y** can redo the last undone action.

---

## <img src="../img/redCapture.png" height="25px" style="display: inline-block; vertical-align: middle;"/> PNG Snapshot

This button captures the current view and prompts you to download it as a PNG image.
The edges are temporarily enhanced in the graph image to make them more visible when printing.
You can also use the keyboard shortcut **Ctrl+G** — useful for taking a snapshot without moving the mouse outside the graph.

---

## <img src="../img/clipShort.png" height="30px" style="display: inline-block; vertical-align: middle;"/> <img src="../img/clipFull.png" height="30px" style="display: inline-block; vertical-align: middle;"/> &nbsp; Clip Report

These icons indicate whether clipped data is empty or filled, showing the results of previous actions.
Click to display the last clipped content in a new tab for quick browsing.

---

## 🔎 Select Mode: OR / AND

* **OR (default):** Adds new elements to the current selection.
* **AND:** Applies the selection **only to already selected elements**, resulting in an AND operation.

💡 **Tip:** Switch back to **OR** after using **AND**, otherwise later selections may return no results.

---

## Hover Toggle

<img src="./img/hoverToggle.png" height="40px" style="display: block; margin: 0 auto;"/>

Displays element details when hovering over nodes or edges.

---

### Perimeter of Actions

The status bar shows the current scope with highlighted numbers:

<img src="./img/perimeterOfActions.png" width="300px" style="display: block; margin: 0 auto;"/>

Tables — visible: 3 selected / 10 total (hidden: 0 selected / 0 total)
Relations — visible: 0 selected / 12 total (hidden: 0 selected / 0 total)

Actions apply to the current perimeter:

* If some visible elements are **selected**, actions apply only to them.
* If no elements are selected, actions apply to the entire visible graph.

In this example:

* A command on tables applies to the 3 visible selected tables.
* A command on relations applies to the 12 visible relations.

---

# Database Access

## <img src="./img/DBmenu.png" width="300px" style="display: inline-block; vertical-align: middle;"/>

The main purpose of **CytographDB** is to create a graph from a PostgreSQL database.

#### Create Graph from DB

* A dropdown lists all available databases.
* Choose one and click **OK** to generate the graph.

#### Connect to DB Only

* Establish a **database connection** to access details when reloading a saved JSON file.

---

# File Access

## <img src="./img/fileMenu.png" width="300px" style="display: inline-block; vertical-align: middle;"/>

### Download

You can save the current graph at any time as a JSON file.
It will be saved to your **local disk** via the browser.

#### Graph Name in Main Bar

<img src="./img/drafInput.png" style="display: block; margin: 0 auto;"/>

### Upload

By default, an upload will try to automatically reconnect to the original database used when the file was downloaded.

#### Compatible Database

If that database is no longer available, you can first connect to a compatible one.
If another database is connected (from previous work or after **Connect to DB only**), you will be prompted for confirmation:
<img src="./img/compatibility.png" width="260px" style="display: block; margin: 0 auto; border:1px solid #888"/>

**Without a Database Connection:**
If no database is connected, some actions **will fail or have no effect**:

<img src="./img/NoDetailsNoDB.png" width="260px" style="display: block; margin: 0 auto; border:1px solid #888"/>

### Default Behavior Without a Database Connection

**Trigger lists and code details are unavailable**
<img src='./img/DBErrorOnTriggers.png' width="160" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

**Table details may be empty**
<img src='./img/DBNoTabeDefinition.png' width="400px" style="display: block; margin: 0 auto; border: 1px solid grey;"/>

---

- ⚪️ [Main](./main.md)
