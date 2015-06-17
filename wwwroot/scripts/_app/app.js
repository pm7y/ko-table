/*global ko: true, $: true, sw: true, ViewModel: true */

$(document).ready(function() {

    sw.elapsed('about to applyBindings');

    ko.applyBindings(new ViewModel());

});