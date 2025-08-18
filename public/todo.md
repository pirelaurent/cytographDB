
NOK prise en compte du AND dans les select de edge
simplify association create a directed edge: pb to find path 


---- know how ----
if a window has been opened to a table details and is not exited by close, 
a further call to display this page will only make blink the title but cannot gie the cursor. Security reason. 

---------Know how memory-------
Find direct links: 
filter by native : root then leaf 
hide not selected : stay collections and some edge between nodes
unselect all things
edges select all : to have only edges selected (no more node)
nodes select from selected edges 
nodes hide not selected 
display layout dagre
-----------------------
index et fk sont inversés dans node list  29 31 pour bidt_stock_mvt
normal: 31 fk, 29 index 77 colonnes.  on a dans le retour 29 fk, 31 index , 77 colonnes
les fk ne sortent pas toutes

avec cyto employee : 3 foreign key 1PK qui est reprise en index 

voirequete export let indexQuery = ` dans dbreq.js pour constraint name, 

voir sendNodeListToHtml : node.data('indexes' ) semble être index + entrants 
on les prend depuis getTableDetails dans dbutils à la racine