//declare var ko: any;
//declare var $: any;
//declare var ko: Knockout;

enum SortDirection {
    ASC,
    DESC
}


class KnockoutTable {

    private maxPagesToshow: number = 5;
    private defaultPageSize: number = 25;

    constructor(pageSize: number) {
      pageSize = pageSize > 0 ? pageSize : this.defaultPageSize
    }

    //The function for the total number of pages
     public pageCount() {
         return 0;
    }


   

}