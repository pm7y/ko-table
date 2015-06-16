
var viewModel = function () {
    var self = this;


    self.rowClicked = function (tr, data) {
        console.log(data);
    };

    self.toggleRowClickability = function (evt) {
        self.rowsClickable($(this).prop('checked') === true)
    };

};

function getData()
{
    $.ajax({
        url: 'api/Data',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data);

            vm.setItems(data);
        },
        error: function (x, y, z) {
            console.log([x, y, z]);
        }
    });
}


var vm = new viewModel();

$(document).ready(function () {

    $('#rowsClickable').change(vm.toggleRowClickability);

    ko.applyBindings(vm);

    getData();
});