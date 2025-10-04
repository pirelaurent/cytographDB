En (cytoscape.js) le layout **breadthfirst** place les nœuds par “profondeurs” après un parcours en largeur (BFS) : on choisit un ou plusieurs **roots** (racines), puis tous les nœuds à distance 1 sont sur un même rang, puis ceux à distance 2, etc. C’est donc idéal pour des arbres/forêts (ou DAGs en mode cercle). ([js.cytoscape.org][1])

### Pourquoi “une ligne horizontale” ?

Souvent parce que :

* presque tous vos nœuds ont la **même profondeur** par rapport aux racines implicites → tout finit sur un seul rang ;
* l’orientation est **droite/gauche** (“rightward”), donc rangs horizontaux ;
* aucune racine explicite ⇒ l’algo en déduit (p.ex. nœuds de plus haut degré si `directed:false`) et ça peut aplatir le graphe. ([Npm Doc][2])

### Réglages utiles (cytoscape.js)

Les options clés pour éviter l’effet “ligne plate” : ([js.cytoscape.org][1])

* `roots`: force les racines (sélecteur ou liste d’IDs).
* `directed: true`: si vos arêtes ont un sens, ça respecte la hiérarchie.
* `direction: 'downward' | 'upward' | 'rightward' | 'leftward'`: oriente les rangs.
* `circle: true`: met chaque profondeur sur **des cercles concentriques** (utile pour éviter les longues lignes).
* `grid: true` (avec `circle:false`): répartit régulièrement les nœuds dans chaque rang.
* `depthSort`: fonction pour **ordonner** les nœuds à même profondeur.
* `spacingFactor`, `avoidOverlap`, `boundingBox`, `nodeDimensionsIncludeLabels`: jouent sur l’encombrement et les chevauchements.
* `fit`, `padding`, `animate…`: confort visuel.

Exemple succinct :

```js
cy.layout({
  name: 'breadthfirst',
  directed: true,
  roots: '#rootA, #rootB',
  direction: 'downward',
  circle: false,
  grid: true,
  depthSort: (a,b) => a.data('order') - b.data('order'),
  spacingFactor: 1.2,
  avoidOverlap: true
}).run();
```

(Variante “pas plat” rapide : mettez `circle: true`.)

### Et si ça reste tassé ?

* Restreignez la zone avec `boundingBox` (ou augmentez `spacingFactor`) pour forcer plus d’espace. ([Stack Overflow][3])
* Si votre graphe n’est **pas** proche d’un arbre (beaucoup de cycles), un layout hiérarchique avancé peut mieux marcher : **dagre** ou **klay** (extensions Cytoscape.js) offrent plus de contrôle sur rangs/espacements. ([GitHub][4])

### Si vous parlez de Cytoscape “Desktop”

Chaque layout a un panneau **Settings…** (après `Layout → Breadthfirst`) pour régler orientation, espacements, etc. Les principes restent les mêmes : choisir des racines et l’orientation évite l’effet “ligne”. ([manual.cytoscape.org][5])

Si vous me collez un mini-extrait de votre graphe (10–30 nœuds + arêtes) ou ce que vous voulez comme orientation, je vous propose une config exacte qui donne le rendu attendu.

[1]: https://js.cytoscape.org/ "Cytoscape.js"
[2]: https://npmdoc.github.io/node-npmdoc-cytoscape/build/apidoc.html "npmdoc.github.io"
[3]: https://stackoverflow.com/questions/29188971/how-to-make-the-breadthfirst-layout-more-compact?utm_source=chatgpt.com "How to make the \"breadthfirst\" layout more compact"
[4]: https://github.com/cytoscape/cytoscape.js-dagre "GitHub - cytoscape/cytoscape.js-dagre: The Dagre layout for DAGs and trees for Cytoscape.js"
[5]: https://manual.cytoscape.org/en/stable/Navigation_and_Layout.html?utm_source=chatgpt.com "11. Navigation and Layout"
