/* jshint -W098 */
var ViewModel = function () {
    var self = this;


    self.rowClicked = function (tr, data) {
        $("#rowClicked").html("<span>You clicked on " + data.name + "</span>");
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
        self.addListener("rowClicked", function (evt) {
            console.log(evt);
        });
    };

    self.loadAllData();
};
