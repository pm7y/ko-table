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
    ko.applyBindings(new ViewModel());
});

