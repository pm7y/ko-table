/*global $: true, ko: true */
/*
 * TODO: support mutiple tables per model
 * TODO: selectable rows
 * TODO: highlightable rows
 * TODO: editable rows
 * TODO: expandable rows
 * TODO: mapped/lookup columns
 * TODO: deletable row(s)
 * TODO: re-order columns
 * TODO: column chooser
 * TODO: group by column
 * TODO: export data
 */


$.fn.pulse = function (done) {
    var options = {
        times: 2,
        duration: 250
    };

    var period = function (callback) {
        $(this).animate({ opacity: 0.2 }, options.duration, function () {
            $(this).animate({ opacity: 1 }, options.duration, callback);
        });
    };
    this.each(function () {
        var i = options.times, self = this;
        var repeat = function () {
            i = i - 1;
            if (!i && done && typeof done === "function") {
                done();
            } else {
                period.call(self, repeat);
            }
            return i;
        };
        period.call(this, repeat);
    });
};

trace = function (m) {
    log(m, 0);
};
debug = function (m) {
    log(m, 1);
};
warn = function (m) {
    log(m, 2);
};
error = function (m) {
    log(m, 3);
};
log = function (m, level) {
    var logging = true;
    var minLevel = 1;
    if (logging === true && level >= minLevel && window["console"] && window["console"]["log"]) {
        window["console"]["log"](m);
    }
};

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
        initialSortDirection: 'desc',
        showDeleteRowButton: false,
        showEditRowButton: false
        }
        */
        trace("koTable init!");
        var params = valueAccessor();
        var table = $(tableElement);

        var thead = $(tableElement).find("thead");
        var tbody = $(tableElement).find("tbody");
        var pageSize = params.pageSize || -1;
        var rowsClickable = params.rowsClickable != null ? params.rowsClickable : false;
        var showSearch = params.showSearch === true ? true : false;
        var allowSort = params.allowSort == null ? true : params.allowSort;
        var initialSortProperty = params.initialSortProperty;
        var initialSortDirection = params.initialSortDirection === "asc" ? "asc" : "desc";
        var showDeleteRowButton = params.showDeleteRowButton === true ? true : false;
        var showEditRowButton = params.showEditRowButton === true ? true : false;

        var kt = new KnockoutTable(pageSize, allowSort, initialSortProperty, initialSortDirection, rowsClickable);
        viewModel.koTable = {};


        var tableViewModel = $.extend(viewModel.koTable, kt);
        if (showEditRowButton === true) {

            thead.find("tr").each(function (i, o) {
                var tr = $(o);
                if (tr.find(".ko-table-search").length === 0) {
                    tr.prepend("<th class=\"edit-column text-center\"></th>");
                }
            });
            tbody.find("tr").each(function (i, o) {
                var tr = $(o);
                if (tr.find("td [data-bind]").length) {
                    tr.prepend("<td class=\"edit-column text-center\" style=\"cursor:pointer;width:0px;padding-left:0;padding-right:0;\"><a class=\"edit-btn\"><span class=\"glyphicon glyphicon-edit text-default small\" style=\"margin:0;\"></span></a></td>");
                }
            });

            tableViewModel.modalRow = null;
            tableViewModel.modalOriginalItem = null;
            tableViewModel.modalItem = ko.observable();

            var modalHtml = "<div class=\"modal fade\" id=\"editModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"editModalLabel\">\
                <div class=\"modal-dialog\" role=\"document\">\
                    <div class=\"modal-content\">\
                        <div class=\"modal-header\">\
                            <button type=\"button\" class=\"close close-button\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\
                            <h4 class=\"modal-title\" id=\"editModalLabel\">Edit Record</h4>\
                        </div>\
                        <div class=\"modal-body\" data-bind=\"template: { name: 'modal-template', data: $data.koTable }\">\</div>\
                        <div class=\"modal-footer\">\
                            <button type=\"button\" class=\"btn btn-default btn-sm close-button\"><span class=\"glyphicon glyphicon-remove\"></span>&nbsp;Cancel</button>\
                            <button type=\"button\" class=\"btn btn-primary btn-sm save-button\"><span class=\"glyphicon glyphicon-floppy-disk\"></span>&nbsp;Save</button>\
                        </div>\
                    </div>\
                </div>\
            </div>";

            $(tableElement).find("tfoot td:first").append(modalHtml);

            $(tableElement).find("#editModal .close-button").click(function () {
                $(tableElement).find("#editModal").modal('hide');
                if (tableViewModel.modalRow) {
                    tableViewModel.modalRow.find("td.bg-info").removeClass("bg-info");
                }
            });
            $(tableElement).find("#editModal .save-button").click(function () {

                if (tableViewModel.modalItem()) {
                    onRowSaveHandler({
                        model: ko.mapping.toJS(tableViewModel.modalItem()),
                        completedCallback: function (savedId) {
                            $(tableElement).find("#editModal").modal('hide');

                            var model = ko.mapping.toJS(tableViewModel.modalItem());
                            var isNew = !model.id;

                            if (isNew) {
                                model.id = parseInt(savedId);

                                tableViewModel.pushItem(model);
                            } else {
                                ko.mapping.fromJS(model, tableViewModel.modalOriginalItem);
                            }

                            var mr = tableViewModel.modalRow;
                            if (mr) {
                                mr.find("td")
                                    .addClass("bg-info")
                                    .pulse(function () {
                                        mr.find("td")
                                            .removeClass("bg-info");
                                    });
                            }
                        }
                    });
                } else {
                    $(tableElement).find("#editModal").modal('hide');
                }

            });
        }

        if (showDeleteRowButton === true) {
            thead.find("tr").each(function (i, o) {
                var tr = $(o);
                if (tr.find(".ko-table-search").length === 0) {
                    tr.prepend("<th class=\"delete-column text-center\"></th>");
                }
            });
            tbody.find("tr").each(function (i, o) {
                var tr = $(o);
                if (tr.find("td [data-bind]").length) {
                    tr.prepend("<td class=\"delete-column text-center\" style=\"cursor:pointer;width:0px;padding-left:0;padding-right:0;\"><a class=\"delete-btn\"><span class=\"glyphicon glyphicon-trash text-danger small\" style=\"margin:0;\"></span></a></td>");
                }
            });
        }


        var onRowClickedHandler, onRowDeleteHandler, onRowSaveHandler;

        viewModel.koTable.addRowClickedHandler = function (callback) {
            if (callback && typeof callback === "function") {
                onRowClickedHandler = callback;
            }
        };
        viewModel.koTable.addRowDeleteHandler = function (callback) {
            if (callback && typeof callback === "function") {
                onRowDeleteHandler = callback;
            }
        };
        viewModel.koTable.addRowSaveHandler = function (callback) {
            if (callback && typeof callback === "function") {
                onRowSaveHandler = callback;
            }
        };
        viewModel.koTableReady.call();

        var clickFunction = function (evt) {
            var clickTarget = $(evt.target);

            if (clickTarget) {
                var clickedRow = $(evt.target).closest("tr");
                if (clickedRow && clickedRow.length >= 0) {
                    var clickedNode = clickedRow.get(0);
                    if (clickedNode) {
                        var data = ko.dataFor(clickedRow.get(0));

                        if ((!clickTarget.closest("button").length && !clickTarget.closest("a").length)) {
                            onRowClickedHandler({ event: evt, tr: clickedRow, model: data });
                        } else if (clickTarget.closest(".delete-column").length) {
                            clickedRow.find("td").addClass("danger");

                            onRowDeleteHandler({
                                event: evt,
                                tr: clickedRow,
                                model: ko.mapping.toJS(data),
                                completedCallback: function() {
                                    clickedRow.find("td").pulse(function() {
                                        tableViewModel.removeItem(data);
                                    });
                                }
                            });
                        } else if (clickTarget.closest(".edit-column").length) {
                            if (!tableViewModel.modalItem()) {
                                tableViewModel.modalItem(ko.mapping.fromJS(ko.mapping.toJS(data)));
                            } else {
                                ko.mapping.fromJS(ko.mapping.toJS(data), tableViewModel.modalItem());
                            }
                            tableViewModel.modalRow = clickedRow;
                            tableViewModel.modalOriginalItem = data;
                            clickedRow.find("td").addClass("bg-info");
                            $('#editModal').modal('show');
                        }
                    }
                }
            }
        };

        tableViewModel.rowsClickable.subscribe(function (newValue) {
            tbody.css("cursor", "default");
            tbody.off("click");

            if (newValue === true && tbody.length) {
                tbody.css("cursor", "pointer");
            }

            tbody.click(clickFunction);
        });

        tbody.css("cursor", "default");
        tbody.off("click");

        if (rowsClickable) {
            tbody.css("cursor", "pointer");
        }

        if (tbody.length) {
            tbody.click(clickFunction);
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
            onRowsClickableChanged: "onRowsClickableChanged",
            onRowDeleteClicked: "onRowDeleteClicked"
        };

        var _items = ko.observableArray([]);
        var internalSortParams = ko.observable({ 'allowSort': allowSort, 'sortProperty': initialSortProperty, 'sortDirection': $.trim((initialSortDirection || "asc")).toLowerCase() });
        var internalPageSize = ko.observable(pageSize && pageSize > 0 ? pageSize : -1);
        var internalRowsClickable = ko.observable(rowsClickable === true);
        var internalRowFilter = ko.observable("");

        self.currentPage = ko.observable(0);

        self.setRowFilter = function (searchString) {
            trace('setRowFilter...');
            var uwSearchString = ko.unwrap(searchString);
            if ($.trim(uwSearchString.toString()).length >= 2) {
                internalRowFilter(uwSearchString.toString().toLowerCase());
            } else {
                internalRowFilter("");
            }
        };

        var items = ko.pureComputed({
            read: function () {
                trace(['read items...', _items()]);
                var rowFilter = ko.unwrap(internalRowFilter);
                if (rowFilter && rowFilter.length) {
                    var filteredItems = [];
                    $.each(_items(), function (i, o) {
                        trace('item...');
                        var jo = ko.mapping.toJS(o);
                        for (var propName in jo) {
                            trace('item2...');
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
                trace('write items...');
                _items(value);
            }
        }, self);

        self.rowsClickable = ko.computed({
            read: function () {
                trace('rowsClickable...read');
                return internalRowsClickable();
            },
            write: function (value) {
                trace('rowsClickable...write');
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
                trace('pageSize...read');
                return internalPageSize();
            },
            write: function (value) {
                trace('pageSize...write');
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
                trace('sortProperty...read');
                return internalSortParams().sortProperty;
            },
            write: function (value) {
                trace('sortProperty...write');
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
                trace('sortDirection...read');
                return internalSortParams().sortDirection;
            },
            write: function (value) {
                trace('sortDirection...write');
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
            trace('toggleSortDirection...');
            var currentSortDir = self.sortDirection();
            var newSortDir = currentSortDir === "asc" ? "desc" : "asc";
            self.sortDirection(newSortDir);
            return newSortDir;
        };

        function objectSortComparer(objA, objB) {
            trace('objectSortComparer...');
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
            trace('clearItems...');
            _items([]);
            self.currentPage(-1);
            self.currentPage(0);
        };

        self.pushItem = function (record) {
            trace('pushItem...');
            _items.push(ko.mapping.fromJS(ko.mapping.toJS(record)));
        };

        self.allItems = function () {
            trace('allItems...');
            return _items();
        };

        self.observableItems = function () {
            trace('observableItems...');
            return _items;
        };

        self.distinctValues = function (property, parseValue) {
            trace('distinctValues...');
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
            trace('setItems...');
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
            _items(objects);
        };

        self.findItem = function (propName, propValue) {
            trace('findItem...');
            var uv = ko.unwrap(propValue);

            var matched = $.grep(_items(), function (o) {
                var uo = ko.unwrap(o);
                var up = ko.unwrap(uo[propName]);

                return up === uv;
            });

            return matched;
        };

        self.removeItem = function (obj) {
            trace('removeItem...');
            var toDelete = $.grep(_items(), function (o) {
                return obj === o;
            });

            $.each(toDelete, function (i, o) {
                _items.remove(o);
            });
        };

        self.gotoNextPage = function () {
            trace('gotoNextPage...');
            if (self.currentPage() < (self.pageCount() - 1)) {
                self.currentPage(self.currentPage() + 1);
            }
        };
        self.gotoPreviousPage = function () {
            trace('gotoPreviousPage...');
            if (self.currentPage() > 0) {
                self.currentPage(self.currentPage() - 1);
            }
        };
        self.gotoLastPage = function () {
            trace('gotoLastPage...');
            self.currentPage(self.pageCount() - 1);
        };
        self.gotoFirstPage = function () {
            trace('gotoFirstPage...');
            self.currentPage(0);
        };
        self.gotoPage = function (page) {
            trace('gotoPage...');
            var newPage = page || 0;
            if (newPage !== self.currentPage()) {
                self.currentPage(newPage);
            }
        };
        self.isFirstPage = ko.pureComputed(function () {
            trace('isFirstPage...');
            return self.currentPage() === 0;
        });

        self.isLastPage = ko.pureComputed(function () {
            trace('isLastPage...');
            return self.currentPage() === (self.pageCount() - 1);
        });

        self.pageCount = ko.pureComputed(function () {
            trace('pageCount...');
            return Math.ceil(internalPageSize() > 0 ? (items().length / internalPageSize()) || 1 : 1);
        });

        self.paginationIndexes = ko.pureComputed(function () {
            trace('paginationIndexes...');
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

            trace('pagedItems... ' + pItems.length);
            return pItems;
        });

        self.hasRows = ko.pureComputed(function () {
            trace('hasRows...');
            return items() && items().length > 0;
        }, self);

        self.paginationRequired = ko.pureComputed(function () {
            trace('paginationRequired...');
            return self.hasRows() && self.pageCount() > 1;
        }, self);

        self.rowCount = ko.pureComputed(function () {
            trace('rowCount...');
            return self.hasRows() ? items().length : 0;
        });

        var internalListeners = {};

        //self.onRowClicked = function (listener) {
        //    trace('onRowClicked...');
        //    addEventHandler(eventTypes.onRowClicked, listener);
        //};
        //self.onRowsClickableChanged = function (listener) {
        //    trace('onRowsClickableChanged...');
        //    addEventHandler(eventTypes.onRowsClickableChanged, listener);
        //};
        //self.onRowDeleteClicked = function (listener) {
        //    trace('onRowDeleteClicked...');
        //    addEventHandler(eventTypes.onRowDeleteClicked, listener);
        //};

        var addEventHandler = function (type, listener) {
            trace('addEventHandler...');
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
            trace('trigger...');
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
            trace('removeListener...');
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
