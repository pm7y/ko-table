/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    self.saveRecordToServer = function(person) {
        //console.log(person);

        $.post("api/Data", person, function () {
            self.loadRecordsFromServer();
        }, "application/json").error(function(a, b, c) { console.log([a,b,c]); });
    };

    self.loadRecordsFromServer = function() {
        // signal start of something that might take a while
        self.waitStart();

        $.getJSON("api/Data", null, function(data) {
            // load the data we received
            self.setItems(data);

            // signal end
            self.waitEnd();
        });
    };

    // onInit is automcatically invoked when koTable is loaded.
    self.onInit = function () {
        sw.elapsed('onInit');

        // load the data form the server
        self.loadRecordsFromServer();

        // hook up handler for when a row is clicked
        self.onRowClicked(function (evt) {
            console.log(evt);
            toastr.info(evt.data.model.name, "You clicked a row!");
        });
    };

});
