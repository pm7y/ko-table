# ko-table #
After looking around I couldn't find a simple and clean way of making html tables pageable and sortable using knockoutjs. This is what I came up with. You might find it useful too.

## Usage ##
There is a demo page in the src which has a fairly expansive example of usage. In a nutshell though here is what you need to do...

Here is an example of what it looks like with a bog standard, bootstrap styled, table. 
To achieve this refer to the html and javascript below.

![An example table](./example_table.png "An example table")

#### HTML ####
The key thing to notice here is the ***koTable*** binding on the table element. The koTable binding will extend the viewModel object adding the necessary functions and fields required to support paging and sorting.

The tbody has a foreach binding bound to the ***pagedItems*** collection. But pagedItems isn't an object in the viewModel so where does it come from you cry? Well, it's added automatically by the ***koTable*** binding.

Notice also the ***ko-table-pagination*** class on the div in the table footer. Any element in the table with this class will be rendered as a pagination control (as in the screenshot above).

```
<table id="table-1" class="table table-striped table-hover" data-bind="koTable: { pageSize: 10}">
	<thead>
	    <tr>
	        <th data-sort-property="id">Id</th>
	        <th data-sort-property="name">Name</th>
	        <th data-sort-property="age">Age</th>
	        <th data-sort-property="company">Company</th>
	        <th data-sort-property="email">Email</th>
	        <th data-sort-property="phone">Phone</th>
	        <th data-sort-property="isActive">Active</th>
	    </tr>
	</thead>
	<tbody data-bind="foreach: pagedItems">
	    <tr>
	        <td><span data-bind="text: id"></span></td>
	        <td><span data-bind="text: name"></span></td>
	        <td><span data-bind="text: age"></span></td>
	        <td><span data-bind="text: company"></span></td>
	        <td><span data-bind="text: email"></span></td>
	        <td><span data-bind="text: phone"></span></td>
	        <td><span data-bind="css: { 'glyphicon-ok': isActive, 'glyphicon-remove': !isActive }" class="sort-icon glyphicon small" aria-hidden="true"></span></td>
	    </tr>
	</tbody>
	<tfoot>
	    <tr>
	        <td>
	            <div class="ko-table-pagination"></div>
	        </td>
	    </tr>
	</tfoot>
</table>
```

#### JavaScript ####

Since the koTable binding extends the viewModel object all you really need to do to make the magic happen is to call self.setItems and pass your object array.

```javascript
var viewModel = function () {
    var self = this;

    self.loadAllData = function getData() {
        $.ajax({
            url: 'api/Data',
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                self.setItems(data);
            }
        });
    };

    self.loadAllData();
};

$(document).ready(function () {
    ko.applyBindings(new viewModel());
});

```