
//if (!ko.observable.fn.withPausing) {
//    ko.observable.fn.withPausing = function () {
//        this.notifySubscribers = function () {
//            if (!this.pauseNotifications) {
//                ko.subscribable.fn.notifySubscribers.apply(this, arguments);
//            }
//        };

//        this.sneakyUpdate = function (newValue) {
//            this.pauseNotifications = true;
//            this(newValue);
//            this.pauseNotifications = false;
//        };

//        return this;
//    };
//}

//$.each($('table').find('.pagingControl'), function (i, o) {
//    $(o).html('<ul class="pagination">\
//<li data-bind="css: { disabled: isFirstPage }"><a href="#" data-bind="click: gotoFirstPage"><span class="glyphicon glyphicon-step-backward" aria-hidden="true"></span></a></li>\
//<li data-bind="css: { disabled: isFirstPage }"><a href="#" data-bind="click: gotoPreviousPage"><span class="glyphicon glyphicon-backward" aria-hidden="true"></span></a></li>\
//<!-- ko foreach: pageIndexes() -->\
//<li data-bind="css: { active: $data==$parent.currentPage() }"><a href="#" data-bind="click: $parent.gotoPage"><span data-bind="text: ($data+1)"></span></a></li>\
//<!-- /ko -->\
//<li data-bind="css: { disabled: isLastPage }"><a href="#" data-bind="click: gotoNextPage"><span class="glyphicon glyphicon-forward" aria-hidden="true"></span></a></li>\
//<li data-bind="css: { disabled: isLastPage }"><a href="#" data-bind="click: gotoLastPage"><span class="glyphicon glyphicon-fast-forward" aria-hidden="true"></span></a></li>\
//</ul>');
//});

//var descendingIconHtml = '<span class="sort-icon glyphicon glyphicon-triangle-bottom small" aria-hidden="true" style="margin-right:5px;"></span>';
//var ascendingIconHtml = '<span class="sort-icon glyphicon glyphicon-triangle-top small" aria-hidden="true" style="margin-right:5px;"></span>';


//var sortableHeading = $('[data-sort-property]');

//sortableHeading.css('cursor', 'pointer');

//sortableHeading.click(function (evt) {
//    //var ctx = ko.contextFor(this);
    
//    //if (ctx.$data.constructor === TablePagination) {
//        $(this).closest('table').find('.sort-icon').remove();

//        var sortProperty = $(this).attr('data-sort-property');
//        var sortDir = ctx.$data.sortDirection() || 'asc';

//        ctx.$data.sort(sortProperty, sortDir === 'asc' ? 'desc' : 'asc');
        
//        if (sortDir === 'desc') {
//            $(this).prepend(descendingIconHtml);
//        } else {
//            $(this).prepend(ascendingIconHtml);
//        }
//    //}

//});

//var SortDir = {
//    ASC: 'asc',
//    DESC: 'desc'
//}


//function SortParms(sortProperty, sortDirection)
//{
//    var self = this;

//    self.property = ko.observable();
//    self.direction = ko.observable();

//    self.update = function (sortProperty, sortDirection) {
//        sortDirection = $.trim((sortDirection || SortDir.ASC));

//        if (self.property() === sortProperty && !sortDir) {
//            // toggle
//            self.sortDirection(currentDir === 'asc' ? 'desc' : 'asc');
//        }
//        else if (currentProp !== sortProperty) {
//            sortDir = sortDir || 'asc';

//            if (currentDir !== sortDir) {
//                self.sortDirection.sneakyUpdate(sortDir);
//            } else {
//                self.sortDirection(sortDir);
//            }

//            self.sortProperty(sortProperty);
//        }


//        self.property(sortProperty);
//        self.direction(sortDirection);
//    };

//    self.shouldSort = ko.pureComputed(function () {
//        return self.property() && self.property().length > 0 && self.direction();
//    }, self);

//    self.update(sortProperty, sortDirection);
//}


//function TablePagination(pageSize, sortProperty, sortDir) {
//    var self = this;

//    var maxPagesToShow = 5;

//    setTimeout(function (me) {
//        var tables = $('table');
//        var rows = tables.find('tr:first');

//        $.each(rows, function (i, tr) {
//            var o = ko.dataFor(tr);

//            if (me && o && o === me) {
//                var sp = me.sortParams();
//                var headers = $(tr).closest('table').find('[data-sort-property]');

//                $.each(headers, function (j, th) {
//                    var tableHeader = $(th);
//                    var sortProperty = tableHeader.attr('data-sort-property');

//                    if (sortProperty === sp.property()) {
//                        if (sp.direction() === SortDir.DESC) {
//                            tableHeader.prepend(descendingIconHtml);
//                        } else {
//                            tableHeader.prepend(ascendingIconHtml);
//                        }
//                    }
//                });
//            }
//        });

//    }, 25, self);

//    self.setItems = function (objects) {
//        if (ko.mapping) {
//            var oa = ko.utils.arrayMap(objects, function (item) {
//                return ko.mapping.fromJS(item);
//            });
//            self.items(oa);
//        }
//        self.items(objects);
//    };

//    self.items = ko.observableArray();
//    self.pageSize = ko.observable(pageSize ? pageSize : 10);
//    self.currentPage = ko.observable(0);

//    self.sortParams = ko.observable(new SortParms(sortProperty, sortDir));

//    function sortObject(a, b) {
//        var aVal = a[self.sortParams.property()];
//        var bVal = b[self.sortParams.property()];

//        if (self.sortParams.direction() === SortDir.DESC) {
//            return ((aVal < bVal) ? 1 : ((aVal > bVal) ? -1 : 0));
//        } else {
//            return ((aVal < bVal) ? -1 : ((aVal > bVal) ? 1 : 0));
//        }
//    }

//    //self.sort = function (sortProperty, sortDir) {
//    //    var currentProp = self.sortProperty();
//    //    var currentDir = self.sortDirection();

//    //    if (currentProp === sortProperty && !sortDir) {
//    //        // toggle
//    //        self.sortDirection(currentDir === 'asc' ? 'desc' : 'asc');
//    //    }
//    //    else if (currentProp !== sortProperty) {
//    //        sortDir = sortDir || 'asc';

//    //        if (currentDir !== sortDir) {
//    //            self.sortDirection.sneakyUpdate(sortDir);
//    //        } else {
//    //            self.sortDirection(sortDir);
//    //        }

//    //        self.sortProperty(sortProperty);
//    //    }
//    //}

//    //The function for the total number of pages
//    self.pageCount = function () {

//        var totpages = (self.items().length / self.pageSize()) || 1;
//        return Math.ceil(totpages);
//    }

//    //The function for Next Page
//    self.gotoNextPage = function () {
//        if (self.currentPage() < self.pageCount() - 1) {
//            self.currentPage(this.currentPage() + 1);
//        }
//    }

//    //The function for Previous Page
//    self.gotoPreviousPage = function () {
//        if (self.currentPage() > 0) {
//            self.currentPage(this.currentPage() - 1);
//        }
//    }

//    self.gotoLastPage = function () {
//        self.currentPage(self.pageCount() - 1);
//    }

//    self.gotoFirstPage = function () {
//        self.currentPage(0);
//    }

//    self.gotoPage = function (page) {
//        self.currentPage(page);
//    }

//    self.isFirstPage = ko.pureComputed(function () {
//        return self.currentPage() === 0;
//    });

//    self.isLastPage = ko.pureComputed(function () {
//        return self.currentPage() === (self.pageCount() - 1);
//    });

//    self.pageIndexes = ko.pureComputed(function () {
//        var pageCount = self.pageCount();
//        var middle = self.currentPage();
//        var radius = (maxPagesToShow - 1) / 2;

//        var last = Math.min(Math.max(middle + radius, self.currentPage() + maxPagesToShow), pageCount);
//        var first = Math.max(0, last - maxPagesToShow);

//        var indexes = [];
//        for (var i = 0; i < last - first; i++) {
//            indexes.push(first + i);
//        }

//        return indexes;
//    }, self);

//    self.pagedData = ko.pureComputed(function () {
//        var pgsize = self.pageSize();
//        var first = pgsize * self.currentPage();
//        var last = first + pgsize;
//        console.log('!');
//        return self.items().sort(sortObject).slice(first, last);
//    }, self);

//    self.hasRows = ko.pureComputed(function () {
//        var hasRows = self.items() && self.items().length > 0;
//        return hasRows;
//    }, self);

//}
