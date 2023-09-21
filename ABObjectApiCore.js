const ABObject = require("../platform/ABObject");
const ABModelApi = require("../platform/ABModelApi");

module.exports = class ABObjectApiCore extends ABObject {
   constructor(attributes, AB) {
      super(attributes, AB);

      this.isAPI = true;

      this.fromValues(attributes);
   }

   ///
   /// Instance Methods
   ///

   /// ABApplication data methods

   fromValues(attributes) {
      super.fromValues(attributes);

      this.readonly = parseInt(attributes.readonly) || 0;
      this.apiType = attributes.apiType || "Read";
      this.request = attributes.request ?? {};
      this.request.headers = attributes.request?.headers ?? [];
      this.response = attributes.response ?? {};
      this.response.fields = attributes.response?.fields ?? [];
      this.isFetched = attributes.isFetched ?? false;
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABObjectQuery instance
    * into the values needed for saving to the DB.
    *
    * @return {json}
    */
   toObj() {
      const result = super.toObj();

      result.isAPI = this.isAPI;
      result.readonly = this.readonly;
      result.apiType = this.apiType;
      result.request = this.request ?? {};
      result.request.headers = this.request?.headers ?? [];
      result.response = this.response ?? {};
      result.response.fields = this.response?.fields ?? [];
      result.isFetched = this.isFetched;

      return result;
   }

   /**
    * @method model
    * return a Model object that will allow you to interact with the data for
    * this ABObjectQuery.
    */
   model() {
      var model = new ABModelApi(this);

      // default the context of this model's operations to this object
      model.contextKey(this.constructor.contextKey());
      model.contextValues({ id: this.id }); // the datacollection.id

      return model;
   }
};
