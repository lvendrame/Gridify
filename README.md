# Gridify

a jQuery plugin to add functionality to tables

## Documentation

## Defaults
    * search
         default value: function (page, pageSize, sortExpression, binder) { }
         description: Function to get the data of each page.
             Params:
                 * page: selected page on grid;
                 * pageSize: rows of each page;
                 * sortExpression: expression of data sorting;
                 * binder: function that shold be called when the data is ready. ex: binder(list); 
    * getTotalRows
         default value: function (setTotalRows) { }
         description: Function to get the count of data in the query.
             Params:
                 * setTotalRows: function that shold be called when the data is ready. ex: setTotalRows(count); 
    * initialPage
         default value: 1
         description: set start page.
    * initialPageSize
         default value: 15
         description: set rows per page
    * templateRow (obsolet)
         default value: null
         description: ???
    * autoSort
         default value: true
         description: set if the "dataColumn" will be used for sorting.
    * pageSizeOptions
         default value: [5, 10, 15, 25, 50]
         description: list of page sizes to be offered.
    * onSelectRow
         default value: function (rowIndex, row, redrawRow) { }
         description: 
    * drawFooter
         default value: true
         description: 
    * drawSelectPageSize
         default value: true
         description: 
    * drawPages
         default value: true
         description: 
    * drawSumary
         default value: true
         description: 

Use example:

Html:
    <table id="tblGrid"></table>

Script:

    function bindGrid(){
        options = {
            search: function (page, pageSize, sortExpression, binder) {
                $http({
                    method: 'GET',
                    url: '/api/MyController/Search',
                    params: {
                        "page": page,
                        "pageSize": pageSize
                        "sortExpression": sortExpression,
                        "myParam": "myValue"
                    }
                }).success(function (result, status, headers, config) {
                    binder(result);
                });
            },
            getTotalRows: function (setTotalRows) {
                $http({
                    method: 'GET',
                    url: '/api/MyController/Search/Count',
                    params: {
                        "myParam": "myValue"
                    }
                }).success(function (result, status, headers, config) {
                    binder(result);
                });
            }
        },
        columns = {
            "+": {
                rowTemplate: "<a click='void(${id_scho})'><img src='../images/view.png' alt='view'></a>",
                afterCreated: function (item, cell) {
                    $(cell).find('a').click(function () { 
                        showDetails(item.id_scho);
                    });
                }
            },
            "doc": { dataColumn: "doc_scho" },
            "name": { dataColumn: "name_scho", style: { width: "70px" } },
            "quantity": { dataColumn: "qtt_scho" }
        };

        $('#tblGrid').gridify(options, columns);

    }