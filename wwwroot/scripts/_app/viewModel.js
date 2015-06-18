/*global toastr: true, $: true, sw: true */

var ViewModel = (function () {
    var self = this;

    self.loadAllData = function () {
        // signal that we are about to
        // do something that might take a while.
        // this will change the bottom border color
        // of the first row to orangey.
        self.waitStart();

        $.ajax({
            url: "api/Data",
            type: "GET",
            dataType: "json",
            success: function (data) {
                self.setItems(data);

                // signal that the potentially long running thing has finished.
                // this will change the bottom border color
                // of the first row to back to it's original color.
                self.waitEnd();
            }
        });
    };

    /*
    onInit is automcatically invoked when the koTable binding 
    has finished configuraing itself.
    */
    self.onInit = function () {
        sw.elapsed('onInit');

        // load the data form the server
        self.loadAllData();

        // hook up handler for when a row is clicked
        self.onRowClicked(function (evt) {
            console.log(evt);
            toastr.info(evt.data.model.name, "You clicked a row!");
        });
    };

});
