angular.module('lv.gridify', []);
angular.module('lv.gridify').directive('gridify', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, element, attrs, controllers) {
            scope.$watch(attrs.gridify, function (value) {
                if (value != undefined) {
                    $(element).show();
                    $(element).gridify(value.options, value.columns);

                } else {
                    $(element).hide();
                }
            });
        }
    };
});

/*
    Html
        <table class="tableResult" id="tblResult" gridify="gridParams"></table>

    Script
        $scope.search = function () {
            var ng = $scope;
            ng.gridParams = {
                options: {
                    search: function (page, pageSize, sortExpression, binder) {
                        $http({
                            method: 'GET',
                            url: '/api/Products',
                            params: {
                                name: ng.filter.name,
                                Page: page,
                                PageSize: pageSize,
                                SortExpression: sortExpression
                            }
                        }).success(function (result, status, headers, config) {
                            binder(eval(result.list));
                        })
                        ng.safeApply();
                    },
                    getTotalRows: function (setTotalRows) {
                        $http({
                            method: 'GET',
                            url: '/api/Products/Count',
                            params: {
                                name: ng.filter.namename
                            }
                        }).success(function (result, status, headers, config) {
                            setTotalRows(result.count);
                        });
                    }
                },
                columns: {
                    "ID": { dataColumn: "ProductID" },
                    "Name": { dataColumn: "ProductName" },
                    "Status": { dataColumn: "ProductStatus" }
                }
            }
        };
    
*/