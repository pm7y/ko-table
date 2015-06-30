/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    var emptyItem = { age: null, company: null, email: null, id: null, isActive: null, name: null, phone: null };
    self.modalItem = ko.mapping.fromJS(emptyItem);
    self.doBeforeRemoveHandler = ko.observable(false);

    self.saveClickHandler = function () {

        var item = ko.mapping.toJS(self.modalItem);
        var isNew = !item.id;

        self.saveItemToServer(item, function (savedId) {
            if (isNew) {
                item.id = parseInt(savedId);
                self.koTable.pushItem(item);
            } else {
                var items = self.koTable.findItem("id", parseInt(item.id));
                ko.mapping.fromJS(self.modalItem, items[0]);
            }
            ko.mapping.fromJS(emptyItem, self.modalItem);
            $('#editModal').modal('hide');
        });

    };

    self.addClickHandler = function () {
        ko.mapping.fromJS(emptyItem, self.modalItem);
        $('#editModal').modal('show');
    };

    self.saveItemToServer = function (item, callback) {
        // signal start of something that might take a while
        self.koTable.waitStart();

        $.post("api/Person", item).always(function (id) {
            // signal end
            self.koTable.waitEnd();

            callback(id);
        });
    };

    self.reloadClickHandler = function () {
        self.getItemsFromServer();
    };

    self.getItemsFromServer = function () {
        // signal start of something that might take a while
        self.koTable.waitStart();

        $.get("api/Person").always(function (data) {
            // load the data we received
            self.koTable.setItems(data);

            // signal end
            self.koTable.waitEnd();
        });
    };

    self.deleteItemFromServer = function (itemId, callback) {
        if (itemId > 0) {
            // signal start of something that might take a while
            self.koTable.waitStart();

            $.ajax({
                url: "api/Person/" + itemId,
                type: "DELETE"
            }).always(function (data) {

                if (callback) {
                    callback();
                }
                // signal end
                self.koTable.waitEnd();
            });
        }
    };

    self.deleteClickHandler = function (data, evt) {
        self.deleteItemFromServer(data.id(), function () {
            $(evt.target).closest("tr")
                .css({ "background-color": "mistyrose" })
                .fadeOut(500, function () {
                    self.koTable.removeItem(data);
                });
        });
    };

    // onInit is automcatically invoked when koTable is loaded.
    self.onInit = function () {
        // load the data form the server
        self.reloadClickHandler();

        // hook up handler for when a row is clicked
        self.koTable.onRowClicked(function (evt) {
            ko.mapping.fromJS(ko.mapping.toJS(evt.data.model), self.modalItem);
            $('#editModal').modal('show');
        });
    };

});
