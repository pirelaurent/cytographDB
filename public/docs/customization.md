# 🎨 Customization

You can enhance your graph for a specific database by adding:
- Custom styles for selected tables
- Custom tags to enable element filtering

---

## 🔌 Extension Points: `customModules`

When a graph is loaded, the app automatically calls two internal methods:

```js
getCustomStyle();
createCustomCategories();
```

You can override these methods by defining your own versions in a custom module.

### Example Custom Module

```js
import { cy } from "../main.js";
import { addCustomCategories, registerCustomModule } from "../customCategories.js";

const myModule = {
  getCustomStyles() {
    // Return an array of styling rules
  },
  createCustomCategories() {
    // Add custom classes and tags to nodes
  }
};

// Register the module with DB names it applies to
registerCustomModule("myDBtest", myModule);
registerCustomModule("myDBstaging", myModule);
```

---

## 🧱 Create Your Own Custom Module

1. **Create a `myModule.js` file**  
   Use `democytodb.js` as a reference template.

2. **Place the file in**:  
   `public/custom`

> 📁 This folder is excluded from version control to protect user-specific code.

####  `.gitignore` Rule

```bash
# Optional: exclude custom modules except for democytodb.js
/public/custom/*
!/public/custom/democytodb.js
```

---

## 🧵 Weave Your Module Into the App

To activate your module:

1. **Edit `customModulesIndex.js`**  
   Add your import in the custom block:

```js
/*
  Add imports for custom modules here
  Modules must be placed in the ./custom directory (not versioned)
*/

import './custom/democytodb.js';

// ----- Add your module below -----
import './custom/myModule.js';
```

2. **Restart the application**

✅ From now on, whenever you open a DB named `myDBtest` or `myDBstaging`,  
the `myModule` customization will be applied automatically.

---
