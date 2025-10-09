# 2.07b

### ReDo command (ctrl y ) 

Allow to move backward from deeper undo (ctrl z)  up to last screen (if no change while )
No automatic saving on simple select on screen. 

### Automatic connection to DB according to Original DB for a saved JSON

No need to connect first before an upload : 
 if json uploaded is on the same current DB
 if the DB named in the json uploaded is still available on the Postres instance. 
 If, after a dialog, the DB Named in Json is given as compatible with current DB. 

### Simple trace 
 add simple trace in trace.js for debug

### follow & show 
 starts with selected. If none starts for visibles.

--- 

# 2.07c

## GUI

Align table output for index and fk
Add markdown export for PK, FK , Index & constraints 
Change leaf and root shape for better distinction 
Symbols for nullable/not null to reduce place in display
Remove *** from table label to identify triggers. Replaced by a symbol. 
Larger font and sizes by default. 



## internal

Change custom load in async to be sure of order (edge vs chrome difference)
Add trap in upload if no db at all. 
Add trap for breadthfirst layout to prevent rare case
Add fit screen after upload


# 2.07d 

Switch root & leaf to be as internal cytoscape definition, no more as FK thinking
Triggers code analysis enhanced ( Execute (some string), missing functions, ...) diplayed as warnings to user 
BreadthFirst parameters changed (one reason about root/leaf redefinition).
doc reviews


# 2.08

main changes with new menu for DB actions. 
See docs. 





