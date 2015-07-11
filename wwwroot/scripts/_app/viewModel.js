/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    var emptyModel;

    function showNewRecordModal() {
        if (self.koTable.modalItem()) {
            ko.mapping.fromJS(emptyModel, self.koTable.modalItem());
        } else {
            self.koTable.modalItem(ko.mapping.fromJS(emptyModel));
        }
        $('#editModal').modal('show');
    }

    function populateEmptyModel(callback) {
        $.get("api/Person/GetEmpty").always(function (data) {
            emptyModel = data;
            callback();
        });
    };

    function getItemsFromServer() {
        $.get("api/Person").always(function (data) {
            // load the data we received
            self.koTable.setItems(data);
        });
    };

    function saveItemToServer(item, callback) {
        $.post("api/Person", item).always(function (id) {
            callback(id);
        });
    };

    function deleteItemFromServer(id, callback) {
        $.ajax({
            url: "api/Person/" + id,
            type: "DELETE"
        }).done(function () {
            callback();
        });
    };

    self.addClickHandler = function () {
        if (!emptyModel) {
            populateEmptyModel(showNewRecordModal);
        } else {
            showNewRecordModal();
        }
    };

    self.reloadClickHandler = function () {
        getItemsFromServer();
    };

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {

        // load the data form the server
        getItemsFromServer();

        // hook up handler for when a row is clicked
        self.koTable.addRowClickedHandler(function (args) {
            console.log(["A row was clicked!", args]);
        });

        // hook up handler for when the modal save button is clicked
        self.koTable.addRowSaveHandler(function (args) {
            console.log(["Save button was clicked!", args]);

            // save the item to server and call the
            // completed callback to pulse the row
            saveItemToServer(args.model, args.completedCallback);
        });

        // hook up handler for when a row's delete button is clicked
        self.koTable.addRowDeleteHandler(function (args) {
            console.log(["The row delete button was clicked!", args]);

            // save the item from server and call the
            // completed callback to pulse the row
            deleteItemFromServer(args.model.id, args.completedCallback);
        });
    };

});
