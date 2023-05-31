/*
/*
 * ABQLRowSaveCore
 *
 * An ABQLRowSave can store the current Data set into the Process Task it is
 * in, so that this data can be made available to other Process Tasks.
 *
 */

import ABQLSetSave from "../../platform/ql/ABQLSetSave.js";

class ABQLRowSaveCore extends ABQLSetSave {}

ABQLRowSaveCore.key = "row_save";
ABQLRowSaveCore.label = "Save the value as";
ABQLRowSaveCore.NextQLOps = [];
// NOTE: currently, this is an ending step. but it doesn't have to be...

export default ABQLRowSaveCore;
