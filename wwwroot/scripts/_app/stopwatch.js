var Stopwatch = (function (name) {
    var _self = this;

    var startMilliseconds = 0;
    var stopMilliseconds = 0;

    _self.start = function (msg) {
        msg = msg || "";
        startMilliseconds = new Date().getTime();
        console.log("Stopwatch [" + name + "] STARTED: " + msg);
    };

    _self.stop = function (msg) {
        msg = msg || "";

        stopMilliseconds = new Date().getTime();

        console.log("Stopwatch [" + name + "] STOPPED [" + _self.elapsedMilliseconds() + "]: " + msg);
    };

    _self.elapsed = function (msg) {
        msg = msg || "";

        stopMilliseconds = new Date().getTime();

        console.log("Stopwatch [" + name + "] ELAPSED [" + _self.elapsedMilliseconds() + "ms]: " + msg);
    };

    _self.elapsedMilliseconds = function() {
        return stopMilliseconds - startMilliseconds;
    };
});

var sw = new Stopwatch('koTable');
sw.start();
