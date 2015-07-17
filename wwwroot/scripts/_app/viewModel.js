/*global toastr: true, $: true */

var BaseModel = (function () {
    var self = this;

    self.getItemsFromServer = function () {
        $.get("api/Person").always(function (data) {
            // load the data we received
            self.koTable.setItems(data);
        });
    };

    self.saveItemToServer = function (item, callback) {
        $.post("api/Person", item).always(function (id) {
            //callback(id, "id");
            callback(id);
        });
    };

    self.deleteItemFromServer = function (id, callback) {
        $.ajax({
            url: "api/Person/" + id,
            type: "DELETE"
        }).done(function () {
            callback();
        });
    };

});

var Example1Model = function () {
    var self = this;

    BaseModel.call(self);

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {

        // load the data form the server
        self.getItemsFromServer();
    };

};

var Example2Model = function () {
    var self = this;

    BaseModel.call(self);

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {

        // load the data form the server
        self.getItemsFromServer();
    };

};

var Example3Model = function () {
    var self = this;

    BaseModel.call(self);

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {

        // load the data form the server
        self.getItemsFromServer();

        // hook up handler for when a row's delete button is clicked
        self.koTable.addRowDeleteHandler(function (args) {
            console.log(["The row delete button was clicked!", args]);

            // save the item from server and call the
            // completed callback to pulse the row
            self.deleteItemFromServer(args.model.id, args.completedCallback);
        });
    };

};

var Example4Model = function () {
    var self = this;

    BaseModel.call(self);

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {

        // load the data form the server
        self.getItemsFromServer();

        // hook up handler for when a row's delete button is clicked
        self.koTable.addRowDeleteHandler(function (args) {
            console.log(["The row delete button was clicked!", args]);

            // save the item from server and call the
            // completed callback to pulse the row
            self.deleteItemFromServer(args.model.id, args.completedCallback);
        });

        // hook up handler for when the modal save button is clicked
        self.koTable.addRowSaveHandler(function (args) {
            console.log(["Save button was clicked!", args]);

            // save the item to server and call the
            // completed callback to pulse the row
            self.saveItemToServer(args.model, args.completedCallback);
        });
    };

};

var Example5Model = function () {
    var self = this;

    BaseModel.call(self);

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {

        self.koTable.overrideModalTemplateId("table-example-4-modal-template");
        self.koTable.specifyEmptyViewModel({ id: null, name: null, age: null, company: null, email: null, phone: null, isActive: false });

        // load the data form the server
        self.getItemsFromServer();

        // hook up handler for when a row's delete button is clicked
        self.koTable.addRowDeleteHandler(function (args) {
            console.log(["The row delete button was clicked!", args]);

            // save the item from server and call the
            // completed callback to pulse the row
            self.deleteItemFromServer(args.model.id, args.completedCallback);
        });

        // hook up handler for when the modal save button is clicked
        self.koTable.addRowSaveHandler(function (args) {
            console.log(["Save button was clicked!", args]);

            // save the item to server and call the
            // completed callback to pulse the row
            self.saveItemToServer(args.model, args.completedCallback);
        });

        // hook up handler for when a row is clicked
        self.koTable.addRowClickedHandler(function (args) {
            toastr.info("You clicked on [" + args.model.name() + "]");
        });
    };

};