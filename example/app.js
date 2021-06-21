"use strict";

(function(){

    const options = {
        search: (page, pageSize, sortExpression)  => {},
        getTotalRows: () => {},
        initialPage: 1,
        initialPageSize: 15,
        templateRow: null,
        autoSort: true,
        pageSizeOptions: [5, 10, 15, 25, 50],
        onSelectRow: (rowIndex, row, redrawRow) => {},
        drawFooter: true,
        drawSelectPageSize: true,
        drawPages: true,
        drawSumary: true
    };

    function table01() {
        var reqUrl = "data02";
        function search(page, pageSize) {
            return getData(reqUrl, false, page, pageSize);
        }

        function getTotalRows() {
            return getData(reqUrl, true);
        }

        const columns = {
            "id": {},
            "first_name": {},
            "last_name": {},
            "email": {},
            "gender": {},
            "ip_address": {}
        };

        const gridify = new Gridify("#table01", 
            Object.assign({}, options, { search, getTotalRows}),
            columns);

    }

    function getData(dataName, onlyTotal, page, pageSize) {
        const request = fetch(`data/${dataName}.json`);
        const start = page * pageSize;

        return request
            .then(data => data.json())
            .then(data => onlyTotal ?
                data.length :
                data.slice(start, start + pageSize)
            );
    }

    table01();
})();