//declare var ko: any;
//declare var $: any;
//declare var ko: Knockout;
var SortDirection;
(function (SortDirection) {
    SortDirection[SortDirection["ASC"] = 0] = "ASC";
    SortDirection[SortDirection["DESC"] = 1] = "DESC";
})(SortDirection || (SortDirection = {}));

var KnockoutTable = (function () {
    function KnockoutTable(pageSize) {
        this.maxPagesToshow = 5;
        this.defaultPageSize = 25;
        pageSize = pageSize > 0 ? pageSize : this.defaultPageSize;
    }
    //The function for the total number of pages
    KnockoutTable.prototype.pageCount = function () {
        return 0;
    };
    return KnockoutTable;
})();
