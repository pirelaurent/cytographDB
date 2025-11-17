

import {
  getCy,
  setCy,
} from "../graph/cytoscapeCore.js";

import {
  setAndRunLayoutOptions,
} from '../core/layout.js';

import { initializeGraph, } from "../core/initializeGraph.js";

import {
  restoreProportionalSize,
  setProportionalNodeSizeByLinks,
  adjustLabelsToCurrentSchemas
} from "../core/nodeOps.js";


import { metrologie } from '../core/metrology.js';


import {
  enterFkSynthesisMode,

  enterFkDetailedMode,
} from "../graph/detailedEdges.js";

import { showAlert, showError, showMultiChoiceDialog } from "../ui/dialog.js";

import { trace } from "../util/tracer.js";

import {
  getLocalDBName,
  setLocalDBName,
  connectToDbByNameWithoutLoading,
  setPostgresConnected,
} from "../dbFront/tables.js";

import { popSnapshot, pushSnapshot, resetSnapshot } from "../util/snapshots.js";

import {
  setNativeNodesCategories,
  getCustomNodesCategories,
  restoreCustomNodesCategories,
  enforceLabelToAlias,
} from "../filters/categories.js";

import { waitLoading,hideWaitLoading } from "../util/popupWait.js";

import { resetPoolFromFront } from "../dbFront/frontToDb.js";








/*
 generate list of nodes label on a new html page 
*/








/*
 as originalDB was saved in download, must reset connection if wrong db in place 
*/



