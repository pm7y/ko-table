
$(document).ready(function () {

    var vm = new viewModel();

    $('#rowsClickable').change(vm.toggleRowClickability);

    ko.applyBindings(vm);

});

