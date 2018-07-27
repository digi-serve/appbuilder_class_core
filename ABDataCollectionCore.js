/*
 * ABDataCollection
 * Defines a set of data that other parts of the Application can work with.
 * it can point to either an ABObject, or ABObjectQuery, and can have an 
 * filter, and sorts defined.
 *
 * 
 *
 */
var ABEmitter = require("../platform/ABEmitter");

module.exports = class ABViewDataCollectionCore extends ABEmitter {

	/**
	 * @param {obj} values  key=>value hash of ABView values
	 * @param {ABApplication} application the application object this view is under
	 * @param {ABView} parent the ABView this view is a child of. (can be null)
	 */
	constructor(values, application, page) {

		super();

		this.application = application;
		this.page = page;

		this.fromValues(values);


		this._data = [];  // an array of Objects we received from the server.

	}

	static contextKey() {
		return 'datacollection';
	}

	// /**
 //     * @method save()
 //     *
 //     * persist this instance of ABViewDataCollection with it's parent
 //     *
 //     *
 //     * @return {Promise}
 //     *         .resolve( {this} )
 //     */
	// save() {
	// 	return new Promise(
	// 		(resolve, reject) => {

	// 			// if this is our initial save()
	// 			if (!this.id) {
	// 				this.id = OP.Util.uuid();   // setup default .id
	// 			}

	// 			var parent = this.parent;

	// 			parent.dataCollectionSave(this)
	// 				.then(resolve)
	// 				.catch(reject);
	// 		}
	// 	)
	// }



	///
	/// Instance Methods
	///


	/**
	 * @method toObj()
	 *
	 * properly compile the current state of this ABViewLabel instance
	 * into the values needed for saving.
	 *
	 * @return {json}
	 */
	toObj() {

		// NOTE: ensure we have a uuid() set:
		if (!this.id) {
			this.id = this.application.uuid();
		}

		this.application.unTranslate(this, this, ['label']);

		var result = {
			id: this.id,
// key: this.key,
// icon: this.icon,

			name: this.name,
			// parent: this.parent,

			settings: this.application.cloneDeep(this.settings || {}),
			translations: this.translations || []

		}

		return result;
	}

	/**
	 * @method fromValues()
	 *
	 * initialze this object with the given set of values.
	 * @param {obj} values
	 */
	fromValues(values) {


		this.id = values.id;			// NOTE: only exists after .save()
// this.key = values.key || this.viewKey();
// this.icon = values.icon || this.viewIcon();

		this.name = values.name;

		// if this is being instantiated on a read from the Property UI,
		// .label is coming in under .settings.label
		values.settings = values.settings || {};
		this.label = values.label || values.settings.label || '?label?';

		this.translations = values.translations || [];

		this.settings = values.settings || {};


		// label is a multilingual value:
		this.application.translate(this, this, ['label']);


		// default value for our label
		if (this.label == '?label?') {
			if (this.parent) {
				this.label = this.parent.label + '.' + "DC."+this.id;
			}
		}

		// Convert to boolean
		this.settings.loadAll = JSON.parse(this.settings.loadAll);
		this.settings.isQuery = JSON.parse(this.settings.isQuery);
	}




	/**
	 * @property datasourceURL
	 * return a url to the ABObject.
	 * 
	 * @return string
	 */
	get datasourceURL() {
		return this.settings.objectUrl;
	}


	/**
	* @property datasource
	* return a object of this component.
	*
	* @return ABObject
	*/
	get datasource() {

		var obj = this.application.urlResolve(this.settings.objectUrl || '');

		return obj;
	}


	/**
	* @property sourceType
	* return type of source.
	*
	* @return {string} - 'object' or 'query'
	*/
	get sourceType() {

		if (this.datasource) {

			if (this.application.objects(obj => obj.id == this.datasource.id)[0])
				return 'object';
			else if (this.application.queries(q => q.id == this.datasource.id)[0])
				return 'query';
			else
				return "";

		}
		else {
			return "";
		}

	}


	/**
	 * @property model
	 * return a source model
	 * 
	 * @return ABModel
	 */
	get model() {
		var obj = this.datasource;

		if (obj) {
			return obj.model();
		}
		else {
			return null;
		}

	}


	/**
	* @method dataCollectionRefresh
	* create a data collection to cache
	*
	* @return {Promise}
	*			.resolve()
	*/

//// NOTE: this implementation is specifically using webix
//// if this nees to be part of the core library, rethink this:

	// init() {

	// 	// prevent initialize many times
	// 	if (this.initialized) return;
	// 	this.initialized = true;

	// 	this.__dataCollection.attachEvent("onAfterCursorChange", () => {

	// 		var currData = this.getCursor();

	// 		this.emit("changeCursor", currData);

	// 	});

	// 	// events
	// 	AD.comm.hub.subscribe('ab.datacollection.create', (msg, data) => {

	// 		if (!this.datasource)
	// 		 	return;
			
	// 		if (this.datasource.id != data.objectId)
	// 			return;

	// 		var rowData = data.data;

	// 		// normalize data before add to data collection
	// 		var model = this.datasource.model();
	// 		model.normalizeData(rowData);

	// 		// filter condition before add 
	// 		if (!this.__filterComponent.isValid(rowData))
	// 			return;

	// 		if (!this.__dataCollection.exists(rowData.id)) {
	// 			this.__dataCollection.add(rowData, 0);
	// 		}

	// 		// filter link data collection's cursor
	// 		var linkDc = this.dataCollectionLink;
	// 		if (linkDc) {
	// 			var linkCursor = linkDc.getCursor();
	// 			this.filterLinkCursor(linkCursor);
	// 		}

	// 	});

	// 	AD.comm.hub.subscribe('ab.datacollection.update', (msg, data) => {

	// 		if (this.datasource &&
	// 			this.datasource.id != data.objectId)
	// 			return;

	// 		// updated values
	// 		var values = data.data;
	// 		if (!values) return;


	// 		if (this.__dataCollection.exists(values.id)) {
	// 			// normalize data before update data collection
	// 			var model = this.datasource.model();
	// 			model.normalizeData(values);
	// 			this.__dataCollection.updateItem(values.id, values);

	// 			// If the update item is current cursor, then should tell components to update.
	// 			var currData = this.getCursor();
	// 			if (currData && currData.id == values.id) {
	// 				this.emit("changeCursor", currData);
	// 			}
	// 		}

	// 		// filter link data collection's cursor
	// 		var linkDc = this.dataCollectionLink;
	// 		if (linkDc) {
	// 			var linkCursor = linkDc.getCursor();
	// 			this.filterLinkCursor(linkCursor);
	// 		}

	// 	});

	// 	// We are subscribing to notifications from the server that an item may be stale and needs updating
	// 	// We will improve this later and verify that it needs updating before attempting the update on the client side
	// 	AD.comm.hub.subscribe('ab.datacollection.stale', (msg, data) => {
	// 		// Verify the datasource has the object we are listening for if not just stop here
	// 		if (this.datasource &&
	// 			this.datasource.id != data.objectId)
	// 			return;

	// 		// updated values
	// 		var values = data.data;
	// 		if (values) {

	// 			if (this.__dataCollection.exists(values.id)) {
	// 				// this data collection has the record so we need to query the server to find out what it's latest data is so we can update all instances
	// 				this.model.findAll({ where: { id: values.id } }).then((res) => {

	// 					// check to make sure there is data to work with
	// 					if (Array.isArray(res.data) && res.data.length) {
	// 						// tell the webix data collection to update using their API with the row id (values.id) and content (res.data[0]) 
	// 						if (this.__dataCollection.exists(values.id)) {
	// 							this.__dataCollection.updateItem(values.id, res.data[0]);
	// 						}

	// 						// If the update item is current cursor, then should tell components to update.
	// 						var currData = this.getCursor();
	// 						if (currData && currData.id == values.id) {
	// 							this.emit("changeCursor", currData);
	// 						}
	// 					} else {
	// 						// If there is no data in the object then it was deleted...lets clean things up
	// 						// If the deleted item is current cursor, then the current cursor should be cleared.
	// 						var currId = this.getCursor();
	// 						if (currId == values.id)
	// 							this.emit("changeCursor", null);

	// 						this.__dataCollection.remove(values.id);
	// 					}
	// 				});

	// 			}
	// 		}

	// 		// filter link data collection's cursor
	// 		var linkDc = this.dataCollectionLink;
	// 		if (linkDc) {
	// 			var linkCursor = linkDc.getCursor();
	// 			this.filterLinkCursor(linkCursor);
	// 		}

	// 	});

	// 	AD.comm.hub.subscribe('ab.datacollection.delete', (msg, data) => {

	// 		if (this.datasource &&
	// 			this.datasource.id != data.objectId)
	// 			return;

	// 		// id of a deleted item
	// 		var deleteId = data.data;

	// 		if (this.__dataCollection.exists(deleteId)) {

	// 			// If the deleted item is current cursor, then the current cursor should be cleared.
	// 			var currId = this.getCursor();
	// 			if (currId == deleteId)
	// 				this.emit("changeCursor", null);

	// 			this.__dataCollection.remove(deleteId);
	// 		}
	// 	});


	// 	// load data to initial the data collection
	// 	if (this.settings.loadAll)
	// 		this.loadData();
	// 	else
	// 		this.__dataCollection.loadNext(20, 0);

	// }

	/**
	* @method dataCollectionLink
	* return a ABDataCollection that link of this.
	*
	* @return {ABDataCollection}
	*/
	get dataCollectionLink() {
		return this.page.dataCollections((dc) => dc.id == this.settings.linkDataCollection)[0];
	}


	/**
	* @method fieldLink
	* return a ABFieldConnect field that link of this.
	*
	* @return {ABFieldConnect}
	*/
	get fieldLink() {

		var object = this.datasource;
		if (!object) return null;

		return object.fields((f) => f.id == this.settings.linkField)[0];
	}


	/**
	 * @method remoteUpdate
	 * this alerts us of a change in our data that came from a remote
	 * source: socket update, Relay response, etc...
	 */
	remoteUpdate(data) {

		return this.processIncomingData(data)
		.then(()=>{
			this.emit('data', this._data);
		})
		
	}

	
	loadData(start, limit, callback) {

		var obj = this.datasource;
		if (obj == null) return Promise.resolve([]);

		var model = obj.model();
		if (model == null) return Promise.resolve([]);

		// reset the context on the Model so any data updates get sent to this
		// DataCollection
		// NOTE: we only do this on loadData(), other operations should be 
		// received by the related Objects.
		model.contextKey(ABViewDataCollectionCore.contextKey());
		model.contextValues({id:this.id});  // the datacollection.id


		var sorts = this.settings.objectWorkspace.sortFields || [];

		// pull filter conditions
		var wheres = this.settings.objectWorkspace.filterConditions;

		// set query condition
		var cond = {
			where: wheres,
			limit: limit || 20,
			skip: start || 0,
			sort: sorts,
		};

		// load all data
		if (this.settings.loadAll) {
			delete cond.limit;
		}

		// get data to data collection
		return model.findAll(cond)
			.then((data) => {

				return this.processIncomingData(data);
				
			}).then((data) => {

				if (callback)
					callback(null, data);

				return data;
			});

	}


	processIncomingData(data) {
		return Promise.resolve()
		.then(()=>{


			return this._data = data;


//// TODO:  An implementation of a DataCollection needs to follow our 
//   specified settings:  fixSelect, dataCollectionLink

// the current implementations are Webix Centric ... 

/*
				return new Promise((resolve, reject)=>{

					// set static cursor
					if (this.settings.fixSelect) {

						// set cursor to the current user
						if (this.settings.fixSelect == "_CurrentUser") {

							var username = OP.User.username();
							var userFields = this.datasource.fields((f) => f.key == "user");

							// find a row that contains the current user
							var row = this.__dataCollection.find((r) => {

								var found = false;

								userFields.forEach((f) => {

									if (found || r[f.columnName] == null) return;

									if (r[f.columnName].filter) { // Array - isMultiple
										found = r[f.colName].filter((data) => data.id == username).length > 0;
									}
									else if (r[f.columnName] == username) {
										found = true;
									}

								});

								return found;

							}, true);

							// set a first row of current user to cursor
							if (row)
								this.__dataCollection.setCursor(row.id);
						} else if (this.settings.fixSelect == "_FirstRecord") {
							// find a row that contains the current user
							var row = this.__dataCollection.find((r) => {
								
								var found = false;
								if (!found) {
									found = true;
									return true; // just give us the first record
								}

							}, true);

							// set a first row of current user to cursor
							if (row)
								this.__dataCollection.setCursor(row.id);
						} else {
							this.setCursor(this.settings.fixSelect);
						}

					}


					var linkDc = this.dataCollectionLink;
					if (linkDc) {

						// filter data by match link data collection
						var linkData = linkDc.getCursor();
						this.filterLinkCursor(linkData);

						// add listeners when cursor of link data collection is changed
						this.eventAdd({
							emitter: linkDc,
							eventName: "changeCursor",
							listener: (currData) => {
								this.filterLinkCursor(currData);
							}
						});

					}
					
					resolve();
					
				});
*/

		})
	}

	reloadData() {
		this._data = [];
		return this.loadData(null, null, null);
	}
	
	
	getData(filter) {
		filter = filter || function() { return true; };
		return this._data.filter(filter);
	}


	/**
	 * @method filterLinkCursor
	 * filter data in data collection by match id of link data collection
	 * 
	 * @param {Object} - current data of link data collection
	 */
	// filterLinkCursor(linkCursor) {

	// 	var fieldLink = this.fieldLink;

	// 	if (this.__dataCollection && fieldLink) {
	// 		this.__dataCollection.filter((item) => {

	// 			// data is empty
	// 			if (item == null) return null;

	// 			// the parent's cursor is not set.
	// 			if (linkCursor == null) return false;

	// 			var linkVal = item[fieldLink.relationName()];
	// 			if (linkVal == null) return false;

	// 			// array - 1:M , M:N
	// 			if (linkVal.filter) {
	// 				return linkVal.filter((obj) => obj.id == linkCursor.id).length > 0;
	// 			}
	// 			else {
	// 				return (linkVal.id || linkVal) == linkCursor.id;
	// 			}

	// 		});
	// 	}

	// }


}