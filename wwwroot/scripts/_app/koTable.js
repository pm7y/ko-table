/*global $: true, ko: true */
/*
 * TODO: selectable rows
 * TODO: highlight rows
 * TODO: edit data
 * TODO: expandable rows
 * TODO: mapped/lookup columns
 * TODO: delete row(s)
 * TODO: re-order/hide columns
 * TODO: group by column
 * TODO: export data
 * 
 */
ko.bindingHandlers.koTable = new (function () {
    var self = this;

    self.init = function (tableElement, valueAccessor, allBindings, viewModel) {
        /*
        koTable: { 
        pageSize: 10, 
        items: [],
        showSearch: false, 
        rowsClickable: true,
        allowSort: true,
        initialSortProperty: 'id',
        initialSortDirection: 'desc'
        }
        */
        var params = valueAccessor();
        var table = $(tableElement);

        var tbody = $(tableElement).find("tbody");
        var tableId = $.trim((table.attr("id") || table.attr("name"))).replace("-", "").replace(".", "").replace("_", "");

        var pageSize = params.pageSize || -1;
        var rowsClickable = params.rowsClickable != null ? params.rowsClickable : false;
        var showSearch = params.showSearch === true ? true : false;
        var allowSort = params.allowSort == null ? true : params.allowSort;
        var initialSortProperty = params.initialSortProperty;
        var initialSortDirection = params.initialSortDirection === "asc" ? "asc" : "desc";

        //table.find('thead').prepend("<tr class=\"header-info-row\"><th colspan=\"100\" class=\"text-right\" style=\"border-color: none !important;border-width: 0 !important;margin:0; padding:0;font-size:10px; font-weight: normal;\"><em><span class=\"text-muted\" data-bind=\"text: 'Row Count: ' + koTable.rowCount()\"></span></em></th></tr>");

        var kt = new KnockoutTable(pageSize, allowSort, initialSortProperty, initialSortDirection, rowsClickable);
        kt.setItems([]);

        var tableViewModel;
        viewModel.koTable = {};
        if ($("table[data-bind*=koTable]").length === 1) {
            tableViewModel = $.extend(viewModel.koTable, kt);
        } else {
            viewModel.koTable[tableId] = {};
            tableViewModel = $.extend(viewModel.koTable[tableId], kt);
        }

        viewModel.koTableReady.call();

        tableViewModel.onRowsClickableChanged(function (evt) {
            tbody.css("cursor", "default");
            tbody.off("click");

            if (evt && evt.data === true && tbody.length) {
                tbody.css("cursor", "pointer");
                tbody.click(tableViewModel.rowClickedCallback);
            }
        });

        tbody.css("cursor", "default");
        tbody.off("click");

        if (rowsClickable) {
            tbody.css("cursor", "pointer");
        }

        if (tbody.length) {
            tbody.click(function (evt) {
                var clickTarget = $(evt.target);
                if ((!clickTarget.closest("button").length && !clickTarget.closest("a").length)) {
                    tableViewModel.rowClickedCallback(evt);
                }
            });
        } else if (!tbody.length) {
            $.error("The table has no tbody element so row clicking will not be enabled!");
        }

        if (allowSort) {
            var descendingIconHtml = "<span class=\"sort-icon glyphicon glyphicon-triangle-bottom\" aria-hidden=\"true\" style=\"margin-left:5px; color:silver; font-size: 10px;\"></span>";
            var ascendingIconHtml = "<span class=\"sort-icon glyphicon glyphicon-triangle-top\" aria-hidden=\"true\" style=\"margin-left:5px; color:silver; font-size: 10px;\"></span>";

            var sortableHeadings = $("[data-sort-property]");
            sortableHeadings.css("cursor", "pointer");

            var currentSortDir = tableViewModel.sortDirection();
            var currentSortProp = tableViewModel.sortProperty();
            var currentSortHeading = $("[data-sort-property='" + currentSortProp + "']");

            if (currentSortDir === "desc") {
                currentSortHeading.append(descendingIconHtml);
            } else {
                currentSortHeading.append(ascendingIconHtml);
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
                    $(this).append(descendingIconHtml);
                } else {
                    $(this).append(ascendingIconHtml);
                }

            });
        }

        $.each(table.find(".ko-table-pagination"), function (i, o) {
            $(o).html("<span data-bind=\"if: !koTable.hasRows()\">There are no records to show at the moment :(</span><ul class=\"pagination\" data-bind=\"if: koTable.paginationRequired()\" style=\"padding: 0 !important; margin: 5px 0 5px 0 !important;\" >" +
                    "<li data-bind=\"css: { disabled: koTable.isFirstPage }\"><a href=\"#\" data-bind=\"click: koTable.gotoFirstPage\"><span class=\"glyphicon glyphicon-step-backward\" aria-hidden=\"true\"></span></a></li>" +
                    "<li data-bind=\"css: { disabled: koTable.isFirstPage }\"><a href=\"#\" data-bind=\"click: koTable.gotoPreviousPage\"><span class=\"glyphicon glyphicon-backward\" aria-hidden=\"true\"></span></a></li>" +
                    "<!-- ko foreach: koTable.paginationIndexes() -->" +
                    "<li data-bind=\"css: { active: $data==$parent.koTable.currentPage() }\"><a href=\"#\" data-bind=\"click: $parent.koTable.gotoPage\"><span data-bind=\"text: ($data+1)\"></span></a></li>" +
                    "<!-- /ko -->" +
                    "<li data-bind=\"css: { disabled: koTable.isLastPage }\"><a href=\"#\" data-bind=\"click: koTable.gotoNextPage\"><span class=\"glyphicon glyphicon-forward\" aria-hidden=\"true\"></span></a></li>" +
                    "<li data-bind=\"css: { disabled: koTable.isLastPage }\"><a href=\"#\" data-bind=\"click: koTable.gotoLastPage\"><span class=\"glyphicon glyphicon-fast-forward\" aria-hidden=\"true\"></span></a></li>" +
                    "</ul><div class=\"text-muted pull-right\" style=\"height:34px; line-height:34px;\" data-bind=\"visable: koTable.rowCount(), text: 'Row Count: ' + koTable.rowCount()\"></div>")
                .closest("td, th").css({ 'padding-left': 0, 'padding-right': 0, 'text-align': "left" }).attr("colspan", 100);
        });

        if (showSearch) {

            var searchInputTimeout;

            $.each(table.find(".ko-table-search"), function (i, o) {
                $(o).addClass("input-group").css({ "width": "100%" });
                $(o).html("<span class=\"glyphicon glyphicon-search input-group-addon input-group-sm\" style=\"top: 0;\"></span>" +
                    "<input type=\"text\" class=\"form-control\" placeholder=\"search...\" value=\"\" />"
                );
                $(o).find("input[type='text']").on("input", function (evt) {
                    clearTimeout(searchInputTimeout);
                    searchInputTimeout = setTimeout(function () {
                        var searchBox = $(evt.target);
                        var searchText = searchBox.val();
                        var searchSpan = $(o).find("span:first");

                        searchSpan.removeClass("glyphicon-search").removeClass("glyphicon-remove");

                        if (searchText.length > 0) {
                            searchSpan.addClass("glyphicon-remove").css({ "cursor": "pointer" }).one("click", function () {
                                searchSpan.removeClass("glyphicon-remove").addClass("glyphicon-search").css({ "cursor": "default" });
                                searchBox.val("").trigger("input");
                            });
                        } else {
                            searchSpan.addClass("glyphicon-search");
                        }

                        tableViewModel.setRowFilter(searchText);
                    }, 500);
                });
                $(o).closest("td, th").css({ 'padding-left': 0, 'padding-right': 0 }).attr("colspan", 100).closest("tr"); //.attr("data-bind", "visible: hasRows()");
            });
        } else {
            table.find(".ko-table-search").closest("td, th").attr("colspan", 100).hide();
        }


    };

})();

var KnockoutTable = (function () {

    function knockoutTable(pageSize, allowSort, initialSortProperty, initialSortDirection, rowsClickable) {
        var self = this;
        var maxPagesToShowInPaginator = 5;
        var eventTypes = {
            onRowClicked: "onRowClicked",
            onRowsClickableChanged: "onRowsClickableChanged"
        };

        var _items = ko.observableArray([]);
        var internalSortParams = ko.observable({ 'allowSort': allowSort, 'sortProperty': initialSortProperty, 'sortDirection': $.trim((initialSortDirection || "asc")).toLowerCase() });
        var internalPageSize = ko.observable(pageSize && pageSize > 0 ? pageSize : -1);
        var internalRowsClickable = ko.observable(rowsClickable === true);
        var internalRowFilter = ko.observable("");

        self.currentPage = ko.observable(0);

        self.setRowFilter = function (searchString) {
            var uwSearchString = ko.unwrap(searchString);
            if ($.trim(uwSearchString.toString()).length >= 2) {
                internalRowFilter(uwSearchString.toString().toLowerCase());
            } else {
                internalRowFilter("");
            }
        };

        var items = ko.pureComputed({
            read: function () {
                var rowFilter = ko.unwrap(internalRowFilter);
                if (rowFilter && rowFilter.length) {
                    var filteredItems = [];
                    $.each(_items(), function (i, o) {

                        var jo = ko.mapping.toJS(o);
                        for (var propName in jo) {
                            if (jo.hasOwnProperty(propName)) {
                                var propVal = (jo[propName] == null ? '' : jo[propName]).toString().toLowerCase();
                                var foundMatch = propVal.indexOf(rowFilter) >= 0;
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
            if (internalRowsClickable()) {
                var clickedTr = $(evt.target).closest("tr");
                var data = ko.dataFor(clickedTr.get(0));

                trigger(eventTypes.onRowClicked, { clickEvent: evt, tr: clickedTr, model: data });
            }
        };

        self.rowsClickable = ko.computed({
            read: function () {
                return internalRowsClickable();
            },
            write: function (value) {
                var currentValue = internalRowsClickable();
                var newValue = value === true ? true : false;

                if (value !== false && !value) {
                    newValue = newValue ? false : true;
                }

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
                var newValue = $.trim(ko.unwrap(value));

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
                var newValue = $.trim((ko.unwrap(value) || "asc")).toLowerCase();

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
            var uA = ko.unwrap(objA);
            var uB = ko.unwrap(objB);

            var oA = ko.unwrap(uA[self.sortProperty()]);
            var oB = ko.unwrap(uB[self.sortProperty()]);

            if (typeof (oA) === "string") {
                oA = oA.toUpperCase();
                oB = oB.toUpperCase();
            }

            if (self.sortDirection() === "desc") {
                return ((oA < oB) ? 1 : ((oA > oB) ? -1 : 0));
            } else {
                return ((oA < oB) ? -1 : ((oA > oB) ? 1 : 0));
            }
        }

        self.clearItems = function () {
            items([]);
            self.currentPage(-1);
            self.currentPage(0);
        };

        self.pushItem = function (record) {
            _items.push(ko.mapping.fromJS(ko.mapping.toJS(record)));
        };

        self.allItems = function () {
            return _items();
        };

        self.observableItems = function () {
            return _items;
        };

        self.distinctValues = function (property, parseValue) {
            var list = [];

            if (parseValue == null || typeof parseValue !== "function") {
                parseValue = function (value) {
                    return value == null ? '' : value.toString();
                };
            }
            $.each(_items(), function (i, o) {
                var uo = ko.unwrap(o);
                var val = ko.unwrap(uo[property]);

                val = parseValue(val);
                if ($.inArray(val, list) === -1) {
                    list.push(val);
                }
            });
            return list.sort();
        };

        self.setItems = function (input) {
            self.clearItems();

            var objects = input;
            if ((typeof input) === "function") {
                objects = input.apply(null, Array.prototype.slice.call(arguments, 1));
            }

            objects = objects || [];

            objects = $.map(objects, function (o) {
                var jo = ko.mapping.toJS(o);
                return ko.mapping.fromJS(jo);
            });

            items(objects);
        };

        self.findItem = function(propName, propValue) {
            var uv = ko.unwrap(propValue);

            var matched = $.grep(_items(), function(o) {
                var uo = ko.unwrap(o);
                var up = ko.unwrap(uo[propName]);

                return up === uv;
            });

            return matched;
        };

        self.removeItem = function(obj) {
            var toDelete = $.grep(_items(), function(o) {
                return obj === o;
            });

            $.each(toDelete, function(i, o) {
                _items.remove(o);
            });
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
            return Math.ceil(internalPageSize() > 0 ? (items().length / internalPageSize()) || 1 : 1);
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
            var first = internalPageSize() > 0 ? internalPageSize() * self.currentPage() : 0;
            var last = internalPageSize() > 0 ? first + internalPageSize() : self.rowCount();

            var pItems;

            if (self.sortProperty()) {
                pItems = items().sort(objectSortComparer).slice(first, last);
            } else {
                pItems = items().slice(first, last);
            }

            return pItems;
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
            addEventHandler(eventTypes.onRowClicked, listener);
        };
        self.onRowsClickableChanged = function (listener) {
            addEventHandler(eventTypes.onRowsClickableChanged, listener);
        };

        var addEventHandler = function (type, listener) {
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