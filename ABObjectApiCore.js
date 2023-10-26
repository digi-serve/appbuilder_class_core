import ABObject from "../platform/ABObject";
import ABModelApi from "../platform/ABModelApi";

export default class ABObjectApiCore extends ABObject {
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

   /**
    * @function getPagingValues()
    *
    * @return {Object} - {
    *                       start: "Property name of the API for start index",
    *                       limit: "Property name of the API for limit return the item number"
    *                     }
    */
   getPagingValues({ skip, limit }) {
      const result = {};
      const pagingSettings = this.request?.paging ?? {};

      if (pagingSettings.start && skip != null) {
         result[pagingSettings.start] = skip;
      }
      if (pagingSettings.limit && limit != null) {
         result[pagingSettings.limit] = limit;
      }

      return result;
   }

   dataFromKey(data) {
      let result = [];

      if (!Array.isArray(data)) data = [data];

      data.forEach((item) => {
         // Clone item
         let itemResult = { ...item };

         // Pull data from `Data key` of the API object
         // FORMAT: "Property.Name.Value"
         (this.response.dataKey ?? "").split(".").forEach((key) => {
            if (key == "" || key == null) return;
            itemResult = itemResult?.[key];
         });

         if (Array.isArray(itemResult)) {
            result = result.concat(itemResult);
         } else if (itemResult) {
            result.push(itemResult);
         }
      });

      return result;
   }

   get headers() {
      const headers = {};

      (this.request.headers ?? []).forEach((header) => {
         if (header?.value == null) return;

         headers[header.key] = header.value;
      });

      return headers;
   }
}
