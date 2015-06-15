

var viewModel = function () {
    var self = this;

    self.example1 = new KnockoutTable();
    //self.example1 = new TablePagination(10, 'name', 'desc');
    //self.example2 = new TablePagination(4, 'id', 'desc');

    //self.example1.setItems(dataset);
    //self.example2.setItems([]);
    self.example1.items(dataset);

    //self.removeFirst = function () {
    //    self.example1.setItems(self.example1.items.slice(1));
    //};

    //self.rowClick = function (item, evt) {
    //    var tbl = $(evt.target).closest('table');
    //    var tr = $(evt.target).closest('tr');

    //    tbl.find('tr.info span').css('font-weight', '');
    //    tbl.find('tr.info').removeClass('info');

    //    if (tr) {
    //        var obj = ko.dataFor(tr.get(0));

    //        tr.addClass('info');
    //        tr.find('span').css('font-weight', 'bold');

    //        console.log(obj);
    //    }
    //};
};

$(document).ready(function () {
    var vm = new viewModel();

    ko.applyBindings(vm);

    //console.log(vm);
});