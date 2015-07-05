/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    var emptyItem = null;
    self.modalItem = ko.observable();

    self.initialized = ko.pureComputed(function () {
        var emptyItemLoaded = self.modalItem && self.modalItem() && self.modalItem().hasOwnProperty("id");

        return emptyItemLoaded;
    });


    self.initialize = function () {

        // get a blank person object from the server
        $.get("api/Person/GetEmpty").always(function (empty) {
            emptyItem = empty;

            self.modalItem(ko.mapping.fromJS(emptyItem));
        });
    };

    self.closeClickHandler = function () {
        $("td.warning").removeClass("warning");
    };

    self.saveClickHandler = function () {
        var item = ko.mapping.toJS(self.modalItem);
        var isNew = !item.id;

        self.saveItemToServer(item, function (savedId) {
            if (isNew) {
                item.id = parseInt(savedId);

                self.koTable.pushItem(item);

                $("#row-" + savedId + " td").addClass("warning");
            } else {
                var items = self.koTable.findItem("id", parseInt(item.id));
                ko.mapping.fromJS(self.modalItem(), items[0]);
            }
            ko.mapping.fromJS(emptyItem, self.modalItem());
            $('#editModal').modal('hide');


            $("td.warning").css({ "background-color": "orange" }).removeClass("warning").animate({ 'backgroundColor': "transparent" }, 1000);
        });

    };

    self.addClickHandler = function () {
        ko.mapping.fromJS(emptyItem, self.modalItem());
        $('#editModal').modal('show');
    };

    self.saveItemToServer = function (item, callback) {
        $.post("api/Person", item).always(function (id) {

            callback(id);
        });
    };

    self.reloadClickHandler = function () {
        self.getItemsFromServer();
    };

    self.getItemsFromServer = function () {
        $.get("api/Person").always(function (data) {
            // load the data we received
            self.koTable.setItems(data);
        });
    };

    self.deleteItemFromServer = function (data, callback) {
        var itemId = data.id();
        if (itemId > 0) {
            $.ajax({
                url: "api/Person/" + itemId,
                type: "DELETE"
            }).done(function (response) {
                if (callback) {
                    callback();
                }
            }).fail(function (response) {
                if (response.responseJSON && response.responseJSON.ExceptionMessage) {
                    response.handled = true;
                    toastr.error("Failed to delete " + data.name() + "; " + response.responseJSON.ExceptionMessage);
                }
            });
        }
    };

    self.deleteClickHandler = function (data, evt) {
        $(evt.target).closest("tr")
            .css({ "background-color": "mistyrose" });

        self.deleteItemFromServer(data, function () {
            $(evt.target).closest("tr")
                .css({ "background-color": "mistyrose" })
                .fadeOut(500, function () {
                    self.koTable.removeItem(data);
                });
        });
    };

    // ready is automcatically invoked when koTable is initialized.
    self.koTableReady = function () {
        // load the data form the server
        self.reloadClickHandler();

        // hook up handler for when a row is clicked
        self.koTable.onRowClicked(function (evt) {
            $(evt.data.tr).find("td").addClass("warning");

            ko.mapping.fromJS(ko.mapping.toJS(evt.data.model), self.modalItem());
            $('#editModal').modal('show');
        });
    };

    self.initialize();
});
