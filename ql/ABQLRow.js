/*
 * ABQLRow
 *
 * Defines all the QL operations that can be performed on a Row of data. This is a
 * Single row/instance of an object.
 *
 */

import QLUpdate from "../../platform/ql/ABQLRowUpdate.js";
import QLSave from "../../platform/ql/ABQLRowSave";
import QLPluck from "../../platform/ql/ABQLRowPluck";

export default [QLUpdate, QLSave, QLPluck];
