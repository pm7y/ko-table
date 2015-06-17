/*global toastr: true, $: true */

var ViewModel = function () {
    var self = this;

    self.rowClicked = function (tr, data) {
        toastr.info(data.name, "You clicked a row!");
    };

    self.toggleRowClickability = function (data, evt) {
        self.rowsClickable($(evt.target).prop("checked") === true);

        return true;
    };

    self.loadAllData = function getData() {
        $.ajax({
            url: "api/Data",
            type: "GET",
            dataType: "json",
            success: function (data) {
                self.setItems(data);
            }
        });
    };

    self.onInit = function () {
        self.onRowClicked(function (evt) {
            console.log(evt);
        });
    };

    self.loadAllData();
};
