/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    self.rowClicked = function (tr, data) {
        toastr.info(data.name, "You clicked a row!");
    };

    self.toggleRowClickability = function (data, evt) {
        self.rowsClickable($(evt.target).prop("checked") === true);

        return true;
    };

    self.loadAllData = function () {
        sw.elapsed('loading data...');
        self.waitStart();

        $.ajax({
            url: "api/Data",
            type: "GET",
            dataType: "json",
            success: function (data) {
                sw.elapsed('data loaded...');

                self.setItems(data);

               // self.waitEnd();
            }
        });
    };

    self.onInit = function () {
        sw.elapsed('onInit');

        self.loadAllData();

        self.onRowClicked(function (evt) {
            console.log(evt);
        });
    };

    
});
