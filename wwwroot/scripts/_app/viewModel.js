/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    self.savePerson = function () {
        var person = $('form').serializeArray();

        $.post("api/Person", person).always(function () {
            self.loadPeople();
        });
    };

    self.loadPeople = function() {
        // signal start of something that might take a while
        self.waitStart();

        $.get("api/Person").always(function (data) {
            // load the data we received
            self.setItems(data);

            // signal end
            self.waitEnd();
        });
    };

    // onInit is automcatically invoked when koTable is loaded.
    self.onInit = function () {
        // load the data form the server
        self.loadPeople();

        // hook up handler for when a row is clicked
        self.onRowClicked(function (evt) {
            toastr.info(evt.data.model.name, "You clicked a row!");
        });
    };

});
