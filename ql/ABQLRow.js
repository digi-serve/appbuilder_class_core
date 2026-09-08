import QLUpdate from "../../platform/ql/ABQLRowUpdate.js";
import QLSave from "../../platform/ql/ABQLRowSave.js";
import QLPluck from "../../platform/ql/ABQLRowPluck.js";

/*
 * ABQLRow
 *
 * Defines all the QL operations that can be performed on a Row of data. This is a
 * Single row/instance of an object.
 *
 */

export default [QLUpdate, QLSave, QLPluck];
