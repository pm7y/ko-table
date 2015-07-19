"use strict";
/* global $: true, ko: true */
/* jshint globalstrict: true */
/* jshint multistr: true */
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

ko.validation.init({
    parseInputAttributes: true,

    errorElementClass: "has-error",
    errorMessageClass: "text-danger",
    errorClass: "has-error",

    decorateInputElement: true,

    insertMessages: false,
    messagesOnModified: false,
    decorateElementOnModified: false,
    grouping: {
        deep: true
    }
});

var log = function (m, level) {
    var logging = true;
    var minLevel = 1;
    if (logging && level >= minLevel && window.console && window.console.log) {
        window.console.log(m);
    }
};
var trace = function (m) {
    log(m, 0);
};
//var debug = function(m) {
//    log(m, 1);
//};
//var warn = function(m) {
//    log(m, 2);
//};
//var error = function(m) {
//    log(m, 3);
//};


ko.bindingHandlers.koTable = {
    init: function (tableElement, valueAccessor, allBindings, viewModel) {
        /*
        koTable: { 
        pageSize: 10, 
        items: [],
        showSearch: false, 
        rowsClickable: true,
        allowSort: true,
        initialSortProperty: 'id',
        initialSortDirection: 'desc',
        showDeleteButton: false,
        showEditButton: false,
        showNewButton: false
        }
        */
        trace("koTable init!");
        var params = valueAccessor();
        var table = $(tableElement);
        var tableId = table.attr("id") || ("koTable-" + $("table").index(table)).replace("-0", "");
        table.attr("id", tableId);
        var modalTemplateId = tableId + "-modal-template";
        var modalId = tableId + "-modal";
        var thead = table.children("thead:first");
        var tbody = table.children("tbody:first");
        var tfoot = table.children("tfoot:first");
        var pageSize = params.pageSize || -1;
        var rowsClickable = params.rowsClickable === true ? true : false;
        var showSearch = params.showSearch === true ? true : false;
        var allowSort = params.allowSort === false ? false : true;
        var initialSortProperty = params.initialSortProperty;
        var initialSortDirection = params.initialSortDirection === "asc" ? "asc" : "desc";
        var showDeleteButton = params.showDeleteButton === true ? true : false;
        var showEditButton = params.showEditButton === true ? true : false;
        var showNewButton = params.showNewButton === true ? true : false;
        var isNew = false;

        var kt = new KnockoutTable(pageSize, allowSort, initialSortProperty, initialSortDirection, rowsClickable);
        viewModel.koTable = {};

        if (showDeleteButton || showEditButton || showNewButton) {

            thead.children("tr").each(function (i, o) {
                $(o).prepend("<th style=\"width:40px; max-width:40px;padding-left:0;padding-right:0;text-align:center;\"></th>");
            });

            tbody.children("tr").each(function (i, o) {
                var tr = $(o);
                //if (tr.children("td [data-bind]").length) {
                tr.prepend("<td style=\"padding-left:0;padding-right:0;text-align:center;\" id=\"ko-controls-" + new Date().getTime() + "\"></td>");
                //}
            });
        }

        $.extend(viewModel.koTable, kt);
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

        viewModel.koTable.overrideModalTemplateId = function (id) {
            modalTemplateId = id;
        };

        var emptyModel = undefined;
        viewModel.koTable.specifyEmptyViewModel = function (em) {
            emptyModel = ko.mapping.toJS(em);
        };

        viewModel.koTableReady.call();

        function setModalItemUnmodified() {
            ko.validation.group(viewModel.koTable.modalItem).find(function (observable) {
                if (ko.validation.utils.isValidatable(observable)) {
                    observable.isModified(false);
                }
            });
        }

        if (showEditButton || showNewButton) {

            tbody.children("tr").each(function (i, o) {
                var tr = $(o);
                //if (tr.children("td [data-bind]").length) {
                tr.children("td:first").prepend("<a class=\"edit-btn\" style=\"cursor:pointer;margin-left:" + (showDeleteButton ? "3px" : "0") + ";\"><span class=\"glyphicon glyphicon-edit text-default small\" style=\"margin:0;\"></span></a>");
                //}
            });

            viewModel.koTable.modalRow = undefined;
            viewModel.koTable.modalOriginalItem = undefined;
            viewModel.koTable.modalItem = undefined;
            viewModel.koTable.modalItemReady = ko.observable(false);
            viewModel.koTable.modalItemIsModified = ko.pureComputed(function () {
                var isModified = false;

                if (viewModel.koTable.modalItemReady) {
                    isModified = !!ko.validation.group(viewModel.koTable.modalItem).find(function (observable) {
                        return ko.validation.utils.isValidatable(observable) && observable.isModified();
                    });
                }

                return isModified;
            });

            var modalHtml = "<div class=\"modal fade\" id=\"" + modalId + "\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"editModalLabel\">\
                <div class=\"modal-dialog\" role=\"document\">\
                    <div class=\"modal-content\">\
                        <div class=\"modal-header\">\
                            <button type=\"button\" class=\"close close-button\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\
                            <h4 class=\"modal-title\">Edit Record</h4>\
                        </div>\
                        <div class=\"modal-body\" data-bind=\"template: { name: '" + modalTemplateId + "', if: $data.koTable.modalItemReady(), data: $data.koTable }\"></div>\
                        <div class=\"modal-footer\">\
                            <button type=\"button\" class=\"btn btn-default btn-sm close-button\"><span class=\"glyphicon glyphicon-remove\"></span>&nbsp;Cancel</button>\
                            <button type=\"button\" class=\"btn btn-primary btn-sm save-button\" data-bind=\"disable: !$data.koTable.modalItemReady() || !$data.koTable.modalItemIsModified() || !$data.koTable.modalItem.isValid()\"><span class=\"glyphicon glyphicon-floppy-disk\"></span>&nbsp;Save</button>\
                        </div>\
                    </div>\
                </div>\
            </div>";

            if (!tfoot.length) {
                table.append("<tfoot><tr><td></td></tr></tfoot>");
                tfoot = table.find("tfoot");
            }

            tfoot.find("td:first").append(modalHtml);

            table.find("#" + modalId + " .close-button").click(function () {
                table.find("#" + modalId).modal("hide");
                if (viewModel.koTable.modalRow) {
                    viewModel.koTable.modalRow.find("td.bg-info").removeClass("bg-info");
                }
            });
            table.find("#" + modalId + " .save-button").click(function () {
                if (viewModel.koTable.modalItem()) {
                    onRowSaveHandler({
                        model: ko.mapping.toJS(viewModel.koTable.modalItem()),
                        completedCallback: function (savedId, idPropertyName) {
                            console.log("completedCallback");
                            table.find("#" + modalId).modal("hide");

                            var model = ko.mapping.toJS(viewModel.koTable.modalItem());
                            if (isNew && savedId) {
                                if (!idPropertyName) {
                                    for (var propName in model) {
                                        if (model.hasOwnProperty(propName) && propName.toLowerCase().match(/id$/) && model[propName] == null) {
                                            idPropertyName = propName;
                                            break;
                                        }
                                    }
                                }
                                model[idPropertyName] = savedId;
                                viewModel.koTable.pushItem(model);
                            } else {
                                ko.mapping.fromJS(model, viewModel.koTable.modalOriginalItem);
                            }
                            console.log(["Updated model...", viewModel.koTable.modalOriginalItem]);
                            var mr = viewModel.koTable.modalRow;
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
                    table.find("#" + modalId).modal("hide");
                }

            });
        }

        if (showDeleteButton === true) {
            tbody.children("tr").each(function (i, o) {
                var tr = $(o);
                //if (tr.children("td [data-bind]").length) {
                tr.children("td:first").prepend("<a class=\"delete-btn\" style=\"cursor:pointer;margin-right:5px;\"><span class=\"glyphicon glyphicon-trash text-danger small\" style=\"margin:0;\"></span></a>");
                //}
            });
        }

        if (showNewButton === true) {
            thead.find("tr").each(function (i, o) {
                $(o).find("th:first").css({ "padding": "0 0 4px 0", "text-align": "center" }).append("<a style=\"padding: 0px 5px 1px 6px;margin-bottom:3px;\" class=\"btn btn-default btn-sm new-btn\"><span class=\"glyphicon glyphicon-plus text-info small\" style=\"margin:0;padding:0;\"></span></a>");
            });
        }

        var clickFunction = function (evt) {
            var clickTarget = $(evt.target);

            if (clickTarget) {
                var clickedRow = $(evt.target).closest("tr");
                if (clickedRow && clickedRow.length >= 0) {
                    var clickedNode = clickedRow.get(0);
                    if (clickedNode) {
                        var data = ko.dataFor(clickedRow.get(0));

                        if ((!clickTarget.closest("thead").length &&
                            !clickTarget.closest("tfoot").length &&
                            !clickTarget.closest(".ko-table-search").length &&
                            !clickTarget.closest("button").length &&
                            !clickTarget.closest("a").length)) {

                            if (onRowClickedHandler && typeof onRowClickedHandler === "function") {
                                onRowClickedHandler({ event: evt, tr: clickedRow, model: data });
                            }
                        } else if (clickTarget.closest(".delete-btn").length) {
                            $("td").removeClass("danger");
                            $(".popover").popover("destroy");

                            clickedRow.find("td").addClass("danger");

                            var tdId = "#" + clickTarget.closest("td").attr("id");
                            clickTarget.popover({ trigger: "manual", container: tdId, placement: "right", html: true, content: "<div class=\"btn-group\"><a class=\"btn btn-sm btn-danger confirm-yes\" data-dismiss=\"confirmation\" href=\"#\" target=\"_self\"><i class=\"glyphicon glyphicon-ok\"></i></a><a class=\"btn btn-default btn-sm confirm-no\" data-dismiss=\"confirmation\"><i class=\"glyphicon glyphicon-remove\"></i></a></div>" }).popover("show");

                            $(".confirm-yes").one("click", function (evt) {
                                $(".popover").popover("destroy");

                                onRowDeleteHandler({
                                    event: evt,
                                    tr: clickedRow,
                                    model: ko.mapping.toJS(data),
                                    completedCallback: function () {
                                        clickedRow.find("td").pulse(function () {
                                            viewModel.koTable.removeItem(data);
                                        });
                                    }
                                });

                                evt.preventDefault();
                                return true;
                            });
                            $(".confirm-no").one("click", function (evt) {
                                $("td").removeClass("danger");
                                $(".popover").popover("destroy");

                                evt.preventDefault();
                                return true;
                            });


                        } else if (clickTarget.closest(".edit-btn").length) {

                            isNew = false;

                            $("td").removeClass("danger");
                            $(".popover").popover("destroy");

                            if (!$("#" + modalTemplateId).length) {
                                alert("A template with id [" + modalTemplateId + "] was not found.");
                                return;
                            }

                            if (!viewModel.koTable.modalItem) {
                                viewModel.koTable.modalItem = ko.validatedObservable(ko.mapping.fromJS(ko.mapping.toJS(data)));
                                viewModel.koTable.modalItemReady(true);
                            } else {
                                ko.mapping.fromJS(ko.mapping.toJS(data), viewModel.koTable.modalItem());
                            }
                            console.log(["Edit clicked!", viewModel.koTable.modalItem(), viewModel.koTable])
                            viewModel.koTable.modalRow = clickedRow;
                            viewModel.koTable.modalOriginalItem = data;
                            clickedRow.find("td").addClass("bg-info");

                            setModalItemUnmodified();
                            $("#" + modalId + " .modal-title").text("Edit Record");
                            $("#" + modalId).modal({ backdrop: "static" });
                        } else if (clickTarget.closest(".new-btn").length) {

                            isNew = true;

                            $("td").removeClass("danger");
                            $(".popover").popover("destroy");

                            if (!$("#" + modalTemplateId).length) {
                                alert("A template with id [" + modalTemplateId + "] was not found.");
                                return;
                            }

                            if (!emptyModel) {
                                var blank = {};
                                var inputs = $($.parseHTML($("#" + modalTemplateId).get(0).innerText)).find("input");
                                inputs.each(function (i, o) {
                                    blank[o.name] = undefined;
                                });
                                emptyModel = blank;
                            }

                            if (!viewModel.koTable.modalItem) {
                                viewModel.koTable.modalItem = ko.validatedObservable(ko.mapping.fromJS(emptyModel));
                                viewModel.koTable.modalItemReady(true);
                            } else {
                                ko.mapping.fromJS(emptyModel, viewModel.koTable.modalItem());
                            }

                            viewModel.koTable.modalRow = undefined;
                            viewModel.koTable.modalOriginalItem = undefined;

                            setModalItemUnmodified();
                            $("#" + modalId + " .modal-title").text("New Record");
                            $("#" + modalId).modal({ backdrop: "static" });
                        }
                    }
                }
            }
        };

        viewModel.koTable.rowsClickable.subscribe(function (newValue) {
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

        if (thead.length) {
            thead.click(clickFunction);
        } else if (!tbody.length) {
            $.error("The table has no thead element so clicking will not be enabled!");
        }

        if (tbody.length) {
            tbody.click(clickFunction);
        } else if (!tbody.length) {
            $.error("The table has no tbody element so clicking will not be enabled!");
        }

        if (allowSort) {
            var descendingIconHtml = "<span class=\"sort-icon glyphicon glyphicon-triangle-bottom\" aria-hidden=\"true\" style=\"margin-left:5px; color:silver; font-size: 10px;\"></span>";
            var ascendingIconHtml = "<span class=\"sort-icon glyphicon glyphicon-triangle-top\" aria-hidden=\"true\" style=\"margin-left:5px; color:silver; font-size: 10px;\"></span>";

            var sortableHeadings = table.find("[data-sort-property]");
            sortableHeadings.css("cursor", "pointer");

            var currentSortDir = viewModel.koTable.sortDirection();
            var currentSortProp = viewModel.koTable.sortProperty();
            var currentSortHeading = table.find("[data-sort-property='" + currentSortProp + "']");

            if (currentSortDir === "desc") {
                currentSortHeading.append(descendingIconHtml);
            } else {
                currentSortHeading.append(ascendingIconHtml);
            }

            sortableHeadings.click(function () {
                sortableHeadings.find(".sort-icon").remove();

                var sortProp = viewModel.koTable.sortProperty();
                var newSortProp = $(this).attr("data-sort-property");
                var newSortDir = "asc";

                if (sortProp === newSortProp) {
                    newSortDir = viewModel.koTable.toggleSortDirection();
                } else {
                    viewModel.koTable.sortProperty(newSortProp);
                }

                if (newSortDir === "desc") {
                    $(this).append(descendingIconHtml);
                } else {
                    $(this).append(ascendingIconHtml);
                }

            });
        }

        if (tfoot.length) {
            tfoot.find("td:first").append("<div class=\"ko-table-pagination\"></div>");
        } else {
            table.append("<tfoot><tr><td><div class=\"ko-table-pagination\"></div></td></tr></tfoot>");
            tfoot = table.find("tfoot");
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

            thead.append("<tr><th colspan=\"1000\"><div class=\"ko-table-search\"></div></th></tr>");

            var koSearch = table.find(".ko-table-search");
            koSearch.addClass("input-group").css({ "width": "100%" });
            koSearch.html("<span class=\"glyphicon glyphicon-search input-group-addon input-group-sm\" style=\"top: 0;\"></span>" +
                "<input type=\"text\" class=\"form-control\" placeholder=\"search...\" value=\"\" />");

            koSearch.find("input[type='text']").on("input", function (evt) {
                clearTimeout(searchInputTimeout);
                searchInputTimeout = setTimeout(function () {
                    var searchBox = $(evt.target);
                    var searchText = searchBox.val();
                    var searchSpan = koSearch.find("span:first");

                    searchSpan.removeClass("glyphicon-search").removeClass("glyphicon-remove");

                    if (searchText.length > 0) {
                        searchSpan.addClass("glyphicon-remove").css({ "cursor": "pointer" }).one("click", function () {
                            searchSpan.removeClass("glyphicon-remove").addClass("glyphicon-search").css({ "cursor": "default" });
                            searchBox.val("").trigger("input");
                        });
                    } else {
                        searchSpan.addClass("glyphicon-search");
                    }

                    viewModel.koTable.setRowFilter(searchText);
                }, 500);
            });
            koSearch.closest("td, th").css({ 'padding-left': 0, 'padding-right': 0 }).attr("colspan", 100).closest("tr"); //.attr("data-bind", "visible: hasRows()");
        } else {
            table.find(".ko-table-search").closest("td, th").attr("colspan", 100).hide();
        }
    }

};

var KnockoutTable = (function () {

    function knockoutTable(pageSize, allowSort, initialSortProperty, initialSortDirection, rowsClickable) {
        /* jshint validthis: true */
        var self = this;
        var maxPagesToShowInPaginator = 5;
        var eventTypes = {
            onRowClicked: "onRowClicked",
            onRowsClickableChanged: "onRowsClickableChanged",
            onRowDeleteClicked: "onRowDeleteClicked"
        };

        var internalItems = ko.observableArray([]);
        var internalSortParams = ko.observable({ 'allowSort': allowSort, 'sortProperty': initialSortProperty, 'sortDirection': $.trim((initialSortDirection || "asc")).toLowerCase() });
        var internalPageSize = ko.observable(pageSize && pageSize > 0 ? pageSize : -1);
        var internalRowsClickable = ko.observable(rowsClickable === true);
        var internalRowFilter = ko.observable("");

        self.currentPage = ko.observable(0);

        self.setRowFilter = function (searchString) {
            trace("setRowFilter...");
            var uwSearchString = ko.unwrap(searchString);
            if ($.trim(uwSearchString.toString()).length >= 2) {
                internalRowFilter(uwSearchString.toString().toLowerCase());
            } else {
                internalRowFilter("");
            }
        };

        var items = ko.pureComputed({
            read: function () {
                trace(["read items...", internalItems()]);
                var rowFilter = ko.unwrap(internalRowFilter);
                if (rowFilter && rowFilter.length) {
                    var filteredItems = [];
                    $.each(internalItems(), function (i, o) {
                        var jo = ko.mapping.toJS(o);
                        for (var propName in jo) {
                            if (jo.hasOwnProperty(propName)) {
                                var propVal = (jo[propName] === undefined ? "" : jo[propName]).toString().toLowerCase();
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
                return internalItems();
            },
            write: function (value) {
                trace("write items...");
                internalItems(value);
            }
        }, self);

        self.rowsClickable = ko.computed({
            read: function () {
                trace("rowsClickable...read");
                return internalRowsClickable();
            },
            write: function (value) {
                trace("rowsClickable...write");
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
                trace("pageSize...read");
                return internalPageSize();
            },
            write: function (value) {
                trace("pageSize...write");
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
                trace("sortProperty...read");
                return internalSortParams().sortProperty;
            },
            write: function (value) {
                trace("sortProperty...write");
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
                trace("sortDirection...read");
                return internalSortParams().sortDirection;
            },
            write: function (value) {
                trace("sortDirection...write");
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
            trace("toggleSortDirection...");
            var currentSortDir = self.sortDirection();
            var newSortDir = currentSortDir === "asc" ? "desc" : "asc";
            self.sortDirection(newSortDir);
            return newSortDir;
        };

        function objectSortComparer(objA, objB) {
            trace("objectSortComparer...");
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
            trace("clearItems...");
            internalItems([]);
            self.currentPage(-1);
            self.currentPage(0);
        };

        self.pushItem = function (record) {
            trace("pushItem...");
            internalItems.push(ko.mapping.fromJS(ko.mapping.toJS(record)));
        };

        self.allItems = function () {
            trace("allItems...");
            return internalItems();
        };

        self.observableItems = function () {
            trace("observableItems...");
            return internalItems;
        };

        self.distinctValues = function (property, parseValue) {
            trace("distinctValues...");
            var list = [];

            if (parseValue === undefined || typeof parseValue !== "function") {
                parseValue = function (value) {
                    return value === undefined ? "" : value.toString();
                };
            }
            $.each(internalItems(), function (i, o) {
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
            trace("setItems...");
            self.clearItems();
            var objects = input || [];

            objects = $.map(objects, function (o) {
                var jo = ko.mapping.toJS(o);
                return ko.mapping.fromJS(jo);
            });
            internalItems(objects);
        };

        self.findItem = function (propName, propValue) {
            trace("findItem...");
            var uv = ko.unwrap(propValue);

            var matched = $.grep(internalItems(), function (o) {
                var uo = ko.unwrap(o);
                var up = ko.unwrap(uo[propName]);

                return up === uv;
            });

            return matched;
        };

        self.removeItem = function (obj) {
            trace("removeItem...");
            var toDelete = $.grep(internalItems(), function (o) {
                return obj === o;
            });

            $.each(toDelete, function (i, o) {
                internalItems.remove(o);
            });
        };

        self.gotoNextPage = function () {
            trace("gotoNextPage...");
            if (self.currentPage() < (self.pageCount() - 1)) {
                self.currentPage(self.currentPage() + 1);
            }
        };
        self.gotoPreviousPage = function () {
            trace("gotoPreviousPage...");
            if (self.currentPage() > 0) {
                self.currentPage(self.currentPage() - 1);
            }
        };
        self.gotoLastPage = function () {
            trace("gotoLastPage...");
            self.currentPage(self.pageCount() - 1);
        };
        self.gotoFirstPage = function () {
            trace("gotoFirstPage...");
            self.currentPage(0);
        };
        self.gotoPage = function (page) {
            trace("gotoPage...");
            var newPage = page || 0;
            if (newPage !== self.currentPage()) {
                self.currentPage(newPage);
            }
        };
        self.isFirstPage = ko.pureComputed(function () {
            trace("isFirstPage...");
            return self.currentPage() === 0;
        });

        self.isLastPage = ko.pureComputed(function () {
            trace("isLastPage...");
            return self.currentPage() === (self.pageCount() - 1);
        });

        self.pageCount = ko.pureComputed(function () {
            trace("pageCount...");
            return Math.ceil(internalPageSize() > 0 ? (items().length / internalPageSize()) || 1 : 1);
        });

        self.paginationIndexes = ko.pureComputed(function () {
            trace("paginationIndexes...");
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

            trace("pagedItems... " + pItems.length);
            return pItems;
        });

        self.hasRows = ko.pureComputed(function () {
            trace("hasRows...");
            return items() && items().length > 0;
        }, self);

        self.paginationRequired = ko.pureComputed(function () {
            trace("paginationRequired...");
            return self.hasRows() && self.pageCount() > 1;
        }, self);

        self.rowCount = ko.pureComputed(function () {
            trace("rowCount...");
            return self.hasRows() ? items().length : 0;
        });

        var internalListeners = {};

        var trigger = function (event, obj) {
            trace("trigger...");
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
            trace("removeListener...");
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