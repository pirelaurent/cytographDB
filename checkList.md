# cytoGraphDB

check list 

### postgres access 

DB - create graph from DB - democytodb 
 graph appears colored
 check intervetion to see stars for triggers 

### custom layout and cutom categories

comment in customModulesIndex.js 
```//import './custom/democytodb.js';```

refresh navigator
DB - create graph from DB - democytodb 
 graph appears default 
Node - filter - by custom category 
 must be empty

uncomment in customModulesIndex.js 
```import './custom/democytodb.js';```
refresh navigator
DB - create graph from DB - democytodb 
 graph appears colored 
Node - filter - by custom category 
 must find *root table*

### selection 

try all select options of nodes 
from selected edges need to have selected (mouse) one or more edges 

try ctrl a  to select all 
try ctrl z to reverse action 

#### degree

no edge  : select table parameters. Can be out of view . use display -fit-selected
looping. : will select employee 
 Edges - select - from selected nodes - edges connecting selected nodes

Outgoing >= 1  all selected except product & company 
change select box of menu from OR to AND 
incoming = 0  : must stay associations : line-product, intervention, authorization

set AND to OR

### filter by

name - set "duct" inRegex   will select production line, line_product, product 
native category : hasTriggers will select intervention 
custom category: root table will select company and product

### follow and show : work on visible or all 
select product and line_product 
hide selected 
select production_line 
    follow incoming -> intervention , authorization 
clic outside : no selected 
change visibility from visible to all 
look at Nodes counts : now 7 visible and 2 hidden are enhanced 
select production_line 
    follow incoming -> intervention , authorization , line_product that appears 



### display 

acts on full visible or on selection 
select only a part of graph 
try all options of display 

### undo 

select part of graph 
diaplay - layout - grid 
