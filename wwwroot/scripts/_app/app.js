"use strict";
/*global ko: true, $: true, toastr: true */
/*global Example1Model: true */
/*global Example2Model: true */
/*global Example3Model: true */
/*global Example4Model: true */
/*global Example5Model: true */
/* jshint globalstrict: true */

$.ajaxSetup({
    global: true
});

$(document).ajaxError(function(evt, xhr, data, error) {

    if (!xhr.handled) {

        var msg = error;
        if (xhr.responseJSON && xhr.responseJSON.ExceptionMessage) {

            msg = xhr.responseJSON.ExceptionMessage;

        }
        toastr.error(msg, "An error occured :(");

    }

});

$(document).ready(function() {

    ko.applyBindings(new Example1Model(), $("#table-example-1").get(0));
    ko.applyBindings(new Example2Model(), $("#table-example-2").get(0));
    ko.applyBindings(new Example3Model(), $("#table-example-3").get(0));
    ko.applyBindings(new Example4Model(), $("#table-example-4").get(0));
    ko.applyBindings(new Example5Model(), $("#table-example-5").get(0));

});