const ABViewWidget = require("../../platform/views/ABViewWidget");


const ABViewGridPropertyComponentDefaults = {
	label: '',	// label is required and you can add more if the component needs them
	// format:0  	// 0 - normal, 1 - title, 2 - description
	dataviewID: '', // uuid of ABDataview
	isEditable: 0,
	massUpdate: 0,
	allowDelete: 0,
	// isFilterable:0,
	isSortable: 0,
	isExportable: 0,
	// linkedObject:'',
	// linkedField:'',
	// linkedPage:'',
	// linkedPageView:'',
	// linkedEditPage:'',
	// linkedEditPageForm:'',
	detailsPage: '',
	detailsTab: '',
	editPage: '',
	editTab: '',
	objectWorkspace: {
		// sortFields:[], // array of columns with their sort configurations
		// filterConditions:[], // array of filters to apply to the data table
		frozenColumnID: "", // id of column you want to stop freezing
		hiddenFields: [], // array of [ids] to add hidden:true to
		summaryColumns: [],
		countColumns: []
	},
	height: 0,
	gridFilter: {
		filterOption: 0,
		queryRules: [],
		userFilterPosition: 'toolbar',
		globalFilterPosition: 'default'
	},
	summaryFields: [], // array of [field ids] to add the summary column in footer
	countFields: [], // array of [field ids] to add the summary column in footer
	height: 0,
	hideHeader: 0,
	labelAsField: 0,
	hideButtons: 0,
	groupBy: '' // id of field
}


const ABViewDefaults = {
	key: 'grid',		// {string} unique key for this view
	icon: 'table',		// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.grid' // {string} the multilingual label key for the class label
}

module.exports = class ABViewGridCore extends ABViewWidget {

	/**
	 * @param {obj} values  key=>value hash of ABView values
	 * @param {ABApplication} application the application object this view is under
	 * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
	 */
	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, defaultValues || ABMenuDefaults);

	}

	static common() {
		return ABViewDefaults;
	}

	static defaultValues() {
		return ABViewGridPropertyComponentDefaults;
	}

	///
	/// Instance Methods
	///

	/**
	 * @method fromValues()
	 *
	 * initialze this object with the given set of values.
	 * @param {obj} values
	 */
	fromValues(values) {

		super.fromValues(values);

		// if this is being instantiated on a read from the Property UI,
		this.settings.dataviewID = this.settings.dataviewID || ABViewGridPropertyComponentDefaults.dataviewID;

		// Convert to boolean
		this.settings.isEditable = JSON.parse(this.settings.isEditable || ABViewGridPropertyComponentDefaults.isEditable);
		this.settings.massUpdate = JSON.parse(this.settings.massUpdate || ABViewGridPropertyComponentDefaults.massUpdate);
		this.settings.allowDelete = JSON.parse(this.settings.allowDelete || ABViewGridPropertyComponentDefaults.allowDelete);
		// this.settings.isFilterable = JSON.parse(this.settings.isFilterable || ABViewGridPropertyComponentDefaults.isFilterable);
		this.settings.isSortable = JSON.parse(this.settings.isSortable || ABViewGridPropertyComponentDefaults.isSortable);
		this.settings.isExportable = JSON.parse(this.settings.isExportable || ABViewGridPropertyComponentDefaults.isExportable);
		this.settings.hideHeader = JSON.parse(this.settings.hideHeader || ABViewGridPropertyComponentDefaults.hideHeader);
		this.settings.labelAsField = JSON.parse(this.settings.labelAsField || ABViewGridPropertyComponentDefaults.labelAsField);
		this.settings.hideButtons = JSON.parse(this.settings.hideButtons || ABViewGridPropertyComponentDefaults.hideButtons);

		// this.settings.linkedObject = this.settings.linkedObject || ABViewGridPropertyComponentDefaults.linkedObject;
		// this.settings.linkedField = this.settings.linkedField || ABViewGridPropertyComponentDefaults.linkedField;
		// this.settings.linkedPage = this.settings.linkedPage || ABViewGridPropertyComponentDefaults.linkedPage;
		// this.settings.linkedPageView = this.settings.linkedPageView || ABViewGridPropertyComponentDefaults.linkedPageView;
		// this.settings.linkedEditPage = this.settings.linkedEditPage || ABViewGridPropertyComponentDefaults.linkedEditPage;
		// this.settings.linkedEditPageForm = this.settings.linkedEditPageForm || ABViewGridPropertyComponentDefaults.linkedEditPageForm;
		this.settings.detailsPage = this.settings.detailsPage || ABViewGridPropertyComponentDefaults.detailsPage;
		this.settings.editPage = this.settings.editPage || ABViewGridPropertyComponentDefaults.editPage;
		this.settings.detailsTab = this.settings.detailsTab || ABViewGridPropertyComponentDefaults.detailsTab;
		this.settings.editTab = this.settings.editTab || ABViewGridPropertyComponentDefaults.editTab;

		this.settings.objectWorkspace = this.settings.objectWorkspace || ABViewGridPropertyComponentDefaults.objectWorkspace;

		if (typeof (this.settings.objectWorkspace) != "undefined") {
			if (typeof (this.settings.objectWorkspace.sortFields) == "undefined") this.settings.objectWorkspace.sortFields = [];
			if (typeof (this.settings.objectWorkspace.filterConditions) == "undefined") this.settings.objectWorkspace.filterConditions = [];
			if (typeof (this.settings.objectWorkspace.frozenColumnID) == "undefined") this.settings.objectWorkspace.frozenColumnID = "";
			if (typeof (this.settings.objectWorkspace.hiddenFields) == "undefined") this.settings.objectWorkspace.hiddenFields = [];
			if (typeof (this.settings.objectWorkspace.summaryColumns) == "undefined") this.settings.objectWorkspace.summaryColumns = [];
			if (typeof (this.settings.objectWorkspace.countColumns) == "undefined") this.settings.objectWorkspace.countColumns = [];
		}

		// we are not allowed to have sub views:
		this._views = [];

		// convert from "0" => 0
		// this.settings.format = parseInt(this.settings.format);
		this.settings.height = parseInt(this.settings.height || 0);

	}

	/**
	 * @method componentList
	 * return the list of components available on this view to display in the editor.
	 */
	componentList() {
		return [];
	}

	removeField(field, cb) {

		let shouldSave = false;

		// check to see if there is a frozenColumnID and if it matches the deleted field
		if (this.settings.objectWorkspace.frozenColumnID && this.settings.objectWorkspace.frozenColumnID == field.columnName) {
			// remove the column name from the frozen column id
			this.settings.objectWorkspace.frozenColumnID = "";
			// flag the object to be saved later
			shouldSave = true;
		}

		// check to see if there are hidden fields
		if (this.settings.objectWorkspace.hiddenFields && this.settings.objectWorkspace.hiddenFields.length) {
			// find if the deleted field is in the array
			let index = this.settings.objectWorkspace.hiddenFields.indexOf(field.columnName);
			// if so splice it out of the array
			if (index > -1) {
				this.settings.objectWorkspace.hiddenFields.splice(index, 1);
				// flag the object to be saved later
				shouldSave = true;
			}
		}

		// check to see if there are hidden fields
		if (this.settings.objectWorkspace.summaryColumns && this.settings.objectWorkspace.summaryColumns.length) {
			// find if the deleted field is in the array
			let index = this.settings.objectWorkspace.summaryColumns.indexOf(field.id);
			// if so splice it out of the array
			if (index > -1) {
				this.settings.objectWorkspace.summaryColumns.splice(index, 1);
				// flag the object to be saved later
				shouldSave = true;
			}
		}

		// check to see if there are hidden fields
		if (this.settings.objectWorkspace.countColumns && this.settings.objectWorkspace.countColumns.length) {
			// find if the deleted field is in the array
			let index = this.settings.objectWorkspace.countColumns.indexOf(field.id);
			// if so splice it out of the array
			if (index > -1) {
				this.settings.objectWorkspace.countColumns.splice(index, 1);
				// flag the object to be saved later
				shouldSave = true;
			}
		}
		// if settings were changed call the callback

		cb(null, shouldSave);

	}

	copyUpdateProperyList() {

		return ['detailsPage', 'detailsTab', 'editPage', 'editTab'];

	}


}