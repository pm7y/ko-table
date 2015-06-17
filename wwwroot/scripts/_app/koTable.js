/*global $: true, ko: true */
ko.bindingHandlers.koTable = {
    init: function (tableElement, valueAccessor, allBindings, viewModel) {
        var params = valueAccessor();
        var table = $(tableElement);

        var tbody = $(tableElement).find("tbody");
        var tableId = $.trim((table.attr("id") || table.attr("name"))).replace("-", "").replace(".", "").replace("_", "");

        var rowsClickable = params.rowsClickable !== null ? params.rowsClickable : params.rowClickedCallback !== null || false;
        var rowClickedCallback = params.rowClickedCallback;

        var kt = new KnockoutTable(params.pageSize, "id", "asc", rowClickedCallback, rowsClickable);
        params.items = params.items || [];
        kt.setItems(params.items);

        var tableViewModel;
        if ($("table[data-bind*=koTable]").length === 1) {
            tableViewModel = $.extend(viewModel, kt);
        } else {
            viewModel[tableId] = {};
            tableViewModel = $.extend(viewModel[tableId], kt);
        }

        tableViewModel.onRowsClickableChanged(function (evt) {
            tbody.css("cursor", "default");
            tbody.off("click");

            if (evt && evt.data === true && rowClickedCallback && tbody.length) {
                tbody.css("cursor", "pointer");
                tbody.click(tableViewModel.rowClickedCallback);
            }
        });

        tbody.css("cursor", "default");
        tbody.off("click");

        if (rowsClickable) {
            tbody.css("cursor", "pointer");
        }

        if (rowClickedCallback && tbody.length) {
            tbody.click(tableViewModel.rowClickedCallback);
        } else if (!tbody.length) {
            $.error("The table has no tbody element so row clicking will not be enabled!");
        }

        var descendingIconHtml = "<span class=\"sort-icon glyphicon glyphicon-triangle-bottom small\" aria-hidden=\"true\" style=\"margin-right:5px;\"></span>";
        var ascendingIconHtml = "<span class=\"sort-icon glyphicon glyphicon-triangle-top small\" aria-hidden=\"true\" style=\"margin-right:5px;\"></span>";

        var sortableHeadings = $("[data-sort-property]");
        sortableHeadings.css("cursor", "pointer");

        var currentSortDir = tableViewModel.sortDirection();
        var currentSortProp = tableViewModel.sortProperty();
        var currentSortHeading = $("[data-sort-property='" + currentSortProp + "']");

        if (currentSortDir === "desc") {
            currentSortHeading.prepend(descendingIconHtml);
        } else {
            currentSortHeading.prepend(ascendingIconHtml);
        }

        sortableHeadings.click(function () {
            sortableHeadings.find(".sort-icon").remove();

            var sortProp = tableViewModel.sortProperty();
            var newSortProp = $(this).attr("data-sort-property");
            var newSortDir = "asc";

            if (sortProp === newSortProp) {
                newSortDir = tableViewModel.toggleSortDirection();
            } else {
                tableViewModel.sortProperty(newSortProp);
            }

            if (newSortDir === "desc") {
                $(this).prepend(descendingIconHtml);
            } else {
                $(this).prepend(ascendingIconHtml);
            }

        });

        $.each(table.find(".ko-table-pagination"), function (i, o) {
            $(o).html("<span data-bind=\"if: !hasRows()\">There are no records to show at the moment :(</span><ul class=\"pagination\" data-bind=\"if: paginationRequired()\" >" +
                    "<li data-bind=\"css: { disabled: isFirstPage }\"><a href=\"#\" data-bind=\"click: gotoFirstPage\"><span class=\"glyphicon glyphicon-step-backward\" aria-hidden=\"true\"></span></a></li>" +
                    "<li data-bind=\"css: { disabled: isFirstPage }\"><a href=\"#\" data-bind=\"click: gotoPreviousPage\"><span class=\"glyphicon glyphicon-backward\" aria-hidden=\"true\"></span></a></li>" +
                    "<!-- ko foreach: paginationIndexes() -->" +
                    "<li data-bind=\"css: { active: $data==$parent.currentPage() }\"><a href=\"#\" data-bind=\"click: $parent.gotoPage\"><span data-bind=\"text: ($data+1)\"></span></a></li>" +
                    "<!-- /ko -->" +
                    "<li data-bind=\"css: { disabled: isLastPage }\"><a href=\"#\" data-bind=\"click: gotoNextPage\"><span class=\"glyphicon glyphicon-forward\" aria-hidden=\"true\"></span></a></li>" +
                    "<li data-bind=\"css: { disabled: isLastPage }\"><a href=\"#\" data-bind=\"click: gotoLastPage\"><span class=\"glyphicon glyphicon-fast-forward\" aria-hidden=\"true\"></span></a></li>" +
                    "</ul>")
                .closest("td, th").css({ 'padding-left': 0, 'padding-right': 0, 'text-align': 'left' }).attr("colspan", 100);
        });

        var searchInputTimeout;

        $.each(table.find(".ko-table-search"), function (i, o) {
            $(o).addClass("input-group").css({ "width": "100%" }).html("<span class=\"glyphicon glyphicon-search input-group-addon input-group-sm\" style=\"top: 0;\"></span>" +
                    "<input type=\"text\" class=\"form-control\" placeholder=\"search...\" />"
            )
                .closest("td, th").css({ 'padding-left': 0, 'padding-right': 0 }).attr("colspan", 100);
        });

        $(".ko-table-search input").on("input", function (evt) {
            clearTimeout(searchInputTimeout);
            searchInputTimeout = setTimeout(function () {
                var searchText = $(evt.target).val();
                tableViewModel.setRowFilter(searchText);
            }, 250);
        });

        tableViewModel.onInit.call();
        //console.log(['init', tableElement, params, bindings, viewModel, bindingContext]);
    }
};

var KnockoutTable = (function () {

    function knockoutTable(pageSize, initialSortProperty, initialSortDirection, rowClickedCallback, rowsClickable) {
        var self = this;
        var maxPagesToShowInPaginator = 5;
        var defaultPageSize = 10;
        var eventTypes = { onRowClicked: "onRowClicked", onRowsClickableChanged: "onRowsClickableChanged" };

        var _items = ko.observableArray();
        var internalSortParams = ko.observable({ 'sortProperty': initialSortProperty, 'sortDirection': $.trim((initialSortDirection || "asc")).toLowerCase() });
        var internalPageSize = ko.observable(pageSize && pageSize > 0 ? pageSize : defaultPageSize);
        var internalRowsClickable = ko.observable(rowsClickable === true);
        var internalRowFilter = ko.observable("");

        self.currentPage = ko.observable(0);

        self.setRowFilter = function (searchString) {
            if ($.trim(searchString.toString()).length >= 2) {
                internalRowFilter(searchString.toString().toLowerCase());
            } else {
                internalRowFilter("");
            }
        };

        var items = ko.pureComputed({
            read: function () {
                if (internalRowFilter() && internalRowFilter().length) {
                    var filteredItems = [];
                    $.each(_items(), function (i, o) {
                        for (var propName in o) {
                            if (o.hasOwnProperty(propName)) {
                                var propVal = o[propName].toString().toLowerCase();
                                var foundMatch = propVal.indexOf(internalRowFilter()) >= 0;
                                if (foundMatch) {
                                    filteredItems.push(o);
                                    break;
                                }
                            }
                        }
                    });
                    return filteredItems;
                }
                return _items();
            },
            write: function (value) {
                _items(value);
            }
        }, self);

        self.rowClickedCallback = function (evt) {
            if (rowClickedCallback && internalRowsClickable()) {
                var clickedTr = $(evt.target).closest("tr");
                var data = ko.dataFor(clickedTr.get(0));

                rowClickedCallback(clickedTr, data);
                trigger(eventTypes.onRowClicked, { tr: clickedTr, model: data });
            }
        };

        self.rowClickedCallbackExists = ko.pureComputed({
            read: function () {
                return rowClickedCallback !== null;
            }
        }, self);

        self.rowsClickable = ko.computed({
            read: function () {
                return internalRowsClickable();
            },
            write: function (value) {

                var currentValue = internalRowsClickable();
                var newValue = value === true ? true : false;
                if (currentValue !== newValue) {
                    trigger(eventTypes.onRowsClickableChanged, newValue);
                    internalRowsClickable(newValue);
                }
            }
        }, self);

        self.pageSize = ko.computed({
            read: function () {
                return internalPageSize();
            },
            write: function (value) {
                var currentValue = internalPageSize();
                var newValue = parseInt(value);

                if (currentValue !== newValue) {
                    value = Math.max(1, value);
                    internalPageSize(value);
                }
            }
        }, self);

        self.sortProperty = ko.computed({
            read: function () {
                return internalSortParams().sortProperty;
            },
            write: function (value) {
                var currentValue = internalSortParams().sortProperty;
                var newValue = $.trim(value);

                if (currentValue !== newValue) {
                    var sp = internalSortParams();
                    sp.sortProperty = newValue;
                    sp.sortDirection = "asc";
                    internalSortParams(sp);
                }
            }
        }, self);

        self.sortDirection = ko.pureComputed({
            read: function () {
                return internalSortParams().sortDirection;
            },
            write: function (value) {
                var currentValue = internalSortParams().sortDirection;
                var newValue = $.trim((value || "asc")).toLowerCase();

                if (currentValue !== newValue) {
                    var sp = internalSortParams();
                    sp.sortDirection = newValue;
                    internalSortParams(sp);
                }
            }
        }, self);

        self.toggleSortDirection = function () {
            var currentSortDir = self.sortDirection();
            var newSortDir = currentSortDir === "asc" ? "desc" : "asc";
            self.sortDirection(newSortDir);
            return newSortDir;
        };

        function objectSortComparer(objA, objB) {
            var oA = objA[self.sortProperty()];
            var oB = objB[self.sortProperty()];

            if (self.sortDirection() === "desc") {
                return ((oA < oB) ? 1 : ((oA > oB) ? -1 : 0));
            } else {
                return ((oA < oB) ? -1 : ((oA > oB) ? 1 : 0));
            }
        }

        self.clearItems = function () {
            items([]);
            self.currentPage(0);
        };

        self.setItems = function (objects) {
            objects = objects || [];
            if (ko.mapping) {
                var oa = ko.utils.arrayMap(objects, function (item) {
                    return ko.mapping.fromJS(item);
                });
                items(oa);
            }
            items(objects);
        };

        self.gotoNextPage = function () {
            if (self.currentPage() < (self.pageCount() - 1)) {
                self.currentPage(self.currentPage() + 1);
            }
        };
        self.gotoPreviousPage = function () {
            if (self.currentPage() > 0) {
                self.currentPage(self.currentPage() - 1);
            }
        };
        self.gotoLastPage = function () {
            self.currentPage(self.pageCount() - 1);
        };
        self.gotoFirstPage = function () {
            self.currentPage(0);
        };
        self.gotoPage = function (page) {
            var newPage = page || 0;
            if (newPage !== self.currentPage()) {
                self.currentPage(newPage);
            }
        };
        self.isFirstPage = ko.pureComputed(function () {
            return self.currentPage() === 0;
        });

        self.isLastPage = ko.pureComputed(function () {
            return self.currentPage() === (self.pageCount() - 1);
        });

        self.pageCount = ko.pureComputed(function () {
            return Math.ceil((items().length / internalPageSize()) || 1);
        });

        self.paginationIndexes = ko.pureComputed(function () {
            var radius = (maxPagesToShowInPaginator - 1) / 2;

            var last = Math.min(Math.max(self.currentPage() + radius, self.currentPage() + maxPagesToShowInPaginator), self.pageCount());
            var first = Math.max(0, last - maxPagesToShowInPaginator);

            var indexes = [];
            for (var i = 0; i < last - first; i++) {
                indexes.push(first + i);
            }

            return indexes;
        });

        self.pagedItems = ko.pureComputed(function () {
            var first = internalPageSize() * self.currentPage();
            var last = first + internalPageSize();

            var pagedItems = items().sort(objectSortComparer).slice(first, last);
            return pagedItems;
        });

        self.hasRows = ko.pureComputed(function () {
            return items() && items().length > 0;
        }, self);

        self.paginationRequired = ko.pureComputed(function () {
            return self.hasRows() && self.pageCount() > 1;
        }, self);

        self.rowCount = ko.pureComputed(function () {
            return self.hasRows() ? items().length : 0;
        });

        var internalListeners = {};

        self.onRowClicked = function (listener) {
            addListener(eventTypes.onRowClicked, listener);
        };
        self.onRowsClickableChanged = function (listener) {
            addListener(eventTypes.onRowsClickableChanged, listener);
        };

        var addListener = function (type, listener) {
            if (typeof internalListeners[type] === "undefined") {
                internalListeners[type] = [];
            }

            var alreadyExists = false;
            if (internalListeners[type] && internalListeners[type].length > 0) {
                $.each(internalListeners[type], function (i, l) {
                    if (l.name && l.name.length && listener.name && listener.name.length) {
                        alreadyExists = l === listener;
                        return !alreadyExists;
                    } else {
                        alreadyExists = l.toString() === listener.toString();
                        return !alreadyExists;
                    }
                });
            }

            if (!alreadyExists) {
                internalListeners[type].push(listener);
            }
        };

        var trigger = function (event, obj) {
            if (typeof event === "string") {
                event = { type: event };
            }
            event.data = obj;
            if (!event.target) {
                event.target = self;
            }

            if (!event.type) {
                $.error("Event object missing 'type' property.");
            }

            if (internalListeners[event.type] instanceof Array) {
                var listeners = internalListeners[event.type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(self, event);
                }
            }
        };

        self.removeListener = function (type, listener) {
            if (internalListeners[type] instanceof Array) {
                var listeners = internalListeners[type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
        };
    }

    return knockoutTable;

})();