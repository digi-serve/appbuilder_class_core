/*
/*
 * ABQLRowSaveCore
 *
 * An ABQLRowSave can store the current Data set into the Process Task it is
 * in, so that this data can be made available to other Process Tasks.
 *
 */

const ABQLSetSave = require("../../platform/ql/ABQLSetSave.js");

class ABQLRowSaveCore extends ABQLSetSave {}

ABQLRowSaveCore.key = "row_save";
ABQLRowSaveCore.label = "save";
ABQLRowSaveCore.NextQLOps = [];
// NOTE: currently, this is an ending step. but it doesn't have to be...

module.exports = ABQLRowSaveCore;
