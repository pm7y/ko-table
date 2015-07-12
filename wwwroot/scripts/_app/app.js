/*global ko: true, $: true, ViewModel: true */

$.ajaxSetup({
    global: true
});

$(document).ajaxError(function (evt, xhr, data, error) {
    if (!xhr.handled) {
        console.log([evt, xhr, data, error]);

        var msg = error;
        if (xhr.responseJSON && xhr.responseJSON.ExceptionMessage)
        {
            msg = xhr.responseJSON.ExceptionMessage;
        }
        toastr.error(msg, "An error occured :(");
    }
});

$(document).ready(function () {
    ko.applyBindings(new Example1Model(), $("#table-example-1").get(0));
    ko.applyBindings(new Example2Model(), $("#table-example-2").get(0));
    ko.applyBindings(new Example3Model(), $("#table-example-3").get(0));
    ko.applyBindings(new Example4Model(), $("#table-example-4").get(0));
    ko.applyBindings(new Example5Model(), $("#table-example-5").get(0));
});

