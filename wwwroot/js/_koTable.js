

var KnockoutTable = (function () {


    function KnockoutTable(pageSize) {
        var self = this;
        var selfId = new Date().getTime();

        
        var maxPagesToShowInPaginator = 5;
        var defaultPageSize = 10;

        self.currentPage = ko.observable(0);
        self.pageSize = ko.observable(pageSize && pageSize > 0 ? pageSize : defaultPageSize);
        self.items = ko.observableArray();

        //self.currentPage.subscribe(function (nv) {
        //    self.trigger('currentPageChanged', 'Current Page = ' + nv);
        //});

        self.gotoNextPage = function () {
            if (self.currentPage() < (self.pageCount() - 1)) {
                self.currentPage(self.currentPage() + 1);
            }
        }

        self.gotoPreviousPage = function () {
            if (self.currentPage() > 0) {
                self.currentPage(self.currentPage() - 1);
            }
        }

        self.gotoLastPage = function () {
            self.currentPage(self.pageCount() - 1);
        }

        self.gotoFirstPage = function () {
            self.currentPage(0);
        }

        self.gotoPage = function (page) {
            var newPage = page || 0;
            if (newPage != self.currentPage()) {
                self.currentPage(newPage);
            }
        }

        self.isFirstPage = ko.pureComputed(function () {
            return self.currentPage() === 0;
        });

        self.isLastPage = ko.pureComputed(function () {
            return self.currentPage() === (self.pageCount() - 1);
        });

        self.pageCount = ko.pureComputed(function () {
            return Math.ceil((self.items().length / self.pageSize()) || 1);
        }, self);

        self.paginationIndexes = ko.pureComputed(function () {
            var radius = (maxPagesToShowInPaginator - 1) / 2;

            var last = Math.min(Math.max(self.currentPage() + radius, self.currentPage() + maxPagesToShowInPaginator), self.pageCount());
            var first = Math.max(0, last - maxPagesToShowInPaginator);

            var indexes = [];
            for (var i = 0; i < last - first; i++) {
                indexes.push(first + i);
            }

            return indexes;
        }, self);

        self.pagedItems = ko.pureComputed(function () {
            var first = self.pageSize() * self.currentPage();
            var last = first + self.pageSize();

            //self.trigger('pagedItemsChanged', 'The data was re-paged!');

            return self.items().slice(first, last);
        }, self);

        self.hasRows = ko.pureComputed(function () {
            var hasRows = self.items() && self.items().length > 0;
            return hasRows;
        }, self);

        self.rowCount = ko.pureComputed(function () {
            return self.hasRows() ? self.items().length : 0;
        }, self);

        //function log(evt) {
        //    console.log(evt);
        //}

        //self.addListener('currentPageChanged', log);
        //self.addListener('pagedItemsChanged', log);
    }

    return KnockoutTable;

})();


// sort stuff
KnockoutTable.prototype = {

    sortItems: function (prop, dir) {

    }

};


// event stuff
KnockoutTable.prototype = {
    _listeners: {},
    addListener: function (type, listener) {
        console.log(this);
        if (typeof this._listeners[type] == "undefined") {
            this._listeners[type] = [];
        }

        this._listeners[type].push(listener);
    },

    trigger: function (event,msg) {
        if (typeof event == "string") {
            event = { type: event };
        }
        event.message = msg || '';
        if (!event.target) {
            event.target = this;
        }

        if (!event.type) {  //falsy
            throw new Error("Event object missing 'type' property.");
        }

        if (this._listeners[event.type] instanceof Array) {
            var listeners = this._listeners[event.type];
            for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i].call(this, event);
            }
        }
    },

    removeListener: function (type, listener) {
        if (this._listeners[type] instanceof Array) {
            var listeners = this._listeners[type];
            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }

};