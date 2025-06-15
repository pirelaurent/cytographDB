# Customization 

How to have : 
- specific categories for choosen database 
- specific styles by default and according to specific categories 

## principles  

### source code to register themselves 

you must create a specific source code  *dbname*.js with two methods : 

``` javascript 
// to add  or overwrite styles relative to default 
export function getCustomStyle() {
  return [
    // some specific selectors 
  ] 

// create some entries in customCategories to allow filter by custom categories in menu 
  export function createCustomCategories() {
  cy.nodes().forEach((node) => {
    //under conditions add class
    node.addClass(someClass); // style defined into customStyles code.somClass 
    // uder some conditions : to be available into filter by custom categories 
    addCustomCategories(node,[category])    
  }
  }
  ```
  ### they must register themselves 

  ``` javacript 
  // autoregister this case 

