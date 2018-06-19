/*
 * ABFieldFile
 *
 * An ABFieldFile defines a File field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");


function L(key, altText) {
// TODO:
	return altText;  // AD.lang.label.getLabel(key) || altText;
}



var ABFieldFileDefaults = {
	key : 'file', // unique key to reference this specific DataField
	// type : 'string', // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
	icon : 'file',   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'		
	
	// menuName: what gets displayed in the Editor drop list
	menuName : L('ab.dataField.file.menuName', '*File Attachment'),
	
	// description: what gets displayed in the Editor description.
	description: L('ab.dataField.file.description', '*Attach a File to this object.'),

	isSortable: false,
	isFilterable: false,
	useAsLabel: false,

	supportRequire: false

}


var defaultValues = {
	removeExistingData: 0,
	fileSize: 0,
	fileType: ""
}



module.exports = class ABFieldFileCore extends ABField {

    constructor(values, object) {
    	super(values, object, ABFieldFileDefaults);

    	// we're responsible for setting up our specific settings:
    	for (var dv in defaultValues) {
    		this.settings[dv] = values.settings[dv] || defaultValues[dv];
    	}


    	// text to Int:
    	this.settings.fileSize = parseInt(this.settings.fileSize);
    	this.settings.limitFileSize = parseInt(this.settings.limitFileSize);
		this.settings.limitFileType = parseInt(this.settings.limitFileType);
    	this.settings.removeExistingData = parseInt(this.settings.removeExistingData);
  	}


  	// return the default values for this DataField
  	static defaults() {
  		return ABFieldFileDefaults;
  	}


	///
	/// Instance Methods
	///

	
	/**
	 * @method isValidData
	 * Parse through the given data and return an error if this field's
	 * data seems invalid.
	 * @param {obj} data  a key=>value hash of the inputs to parse.
	 * @param {OPValidator} validator  provided Validator fn
	 * @return {array} 
	 */
	isValidData(data, validator) {
		
		super.isValidData(data, validator);
		
	}

}

