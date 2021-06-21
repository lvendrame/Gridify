/*
Gridify - 2013
Created by: Luís Fernando Vendrame
*/
'use strict';
; (function ($, window, document, undefined) {

    var pluginName = 'gridify',
        defaults = {
            search: function (page, pageSize, sortExpression, binder) { },
            getTotalRows: function (setTotalRows) { },
            initialPage: 1,
            initialPageSize: 15,
            templateRow: null,
            autoSort: true,
            pageSizeOptions: [5, 10, 15, 25, 50],
            onSelectRow: function (rowIndex, row, redrawRow) { },
            drawFooter: true,
            drawSelectPageSize: true,
            drawPages: true,
            drawSumary: true
        },
        def_lang = {
            sumary: "Exibindo de {fromRow} até {toRow} de um total de {totalRows}",
            itensPerPageMessage: "Itens exibidos por página: ",
            emptyDataMessage: "Nenhum registro foi encontrado.",
            page_previous: "&lt;",
            page_next: "&gt;",
            page_first: "&lt;&lt;",
            page_last: "&gt;&gt;",
            sort_none: "&#8597;",
            sort_asc: "&#9660;",
            sort_desc: "&#9650;"
        },
        self = null;

        //        columns{
        //            "header"{
        //                caption: "", //optional
        //                afterHeaderCreated: function(cell){},
        //                headerStyle: {backgroundColor:"#fff", heigth: "35px"},
        //                headerClass: "",
        //                rowTemplate: "<a href='pagina.aspx?codigo=${codigo}'>Editar</a>",
        //                formatFunction: function(item, data, dataName){ return data.toString(); },
        //                dataColumn: "nomeCampo",
        //                sortColumn: "nomeCampo",
        //                initialSort: '',
        //                showDetailRow: function(detail, row, closeDetail){ detail.append("<span>Detalhes</span>")},
        //                style: {backgroundColor:"#fff", heigth: "35px"},
        //                afterCreated: function(item, cell){},
        //                className: ""
        //            },
        //            "header 2"{
        //                rowTemplate: "<a href='pagina.aspx?codigo=${codigo}'>Editar</a>",
        //                formatFunction: function(item, data, dataName){ return data.toString(); },
        //                dataColumn: "nomeCampo",
        //                sortColumn: "nomeCampo",
        //                initialSort: '', // asc | desc | none
        //                showDetailRow: function(detail, row, closeDetail){ detail.append("<span>Detalhes</span>")},
        //                style: {backgroundColor:"#fff", heigth: "35px"},
        //                afterCreated: function(item, cell){},
        //                className: ""
        //            }
        //        }



    function Gridify(element, options, columns, language) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this.options.language = $.extend({}, def_lang, language);
        this.columns = columns;

        this._defaults = defaults;
        this._name = pluginName;
        self = this;

        this.init();
    }

    Gridify.prototype = {

        init: function(){
            this.pageSize = this.options.initialPageSize;
            this.totalRows = 0;
            this.resetPageValues();
            this.createBaseElements();
        },

        resetPageValues: function(){
            this.page = this.options.initialPage;
            this.fromRow = 1;
            this.toRow = this.pageSize;
            this.selectedRow = -1;
            this.sortColumns = {};            
        },

        createBaseElements: function () {
            var table = $(this.element);

            var header = table.find("thead");
            if (header.length == 0) {
                header = $(document.createElement("thead"));
                table.append(header);
            } else {
                header.removeAttr('isInitialized');
            }

            var body = table.find("tbody");
            if (body.length == 0) {
                body = $(document.createElement("tbody"));
                table.append(body);
            }

            var footer = table.find("tfoot");
            if (footer.length == 0) {
                footer = $(document.createElement("tfoot"));
                table.append(footer);
            } else {
                footer.find("tr td").html("");
            }

            table.addClass('tblGdy');
            this.search(true);
        },

        //create header
        createHeader: function(header){
            if (!header.attr('isInitialized')) {
                !header.attr('isInitialized', true);
                header.html("");
                var tr = $("<tr></tr>");
                this.columnsCount = 0;

                for (var headerName in this.columns) {
                    this.createHeaderColumn(tr, this.columns[headerName], headerName);
                    this.columnsCount++;
                }
                header.append(tr);
            }
        },

        createHeaderColumn: function(tr, column, headerName){
            
            var th = $("<th></th>");
            tr.append(th);            

            if (typeof column.formatFunction == 'undefined')
                column.formatFunction = function (item, data, dataName) {
                    return typeof data != "undefined" && data != null ? data.toString() : ""; 
                };


            if ((this.options.autoSort && typeof column.dataColumn != "undefined") || typeof column.sortColumn != "undefined") {

                var sortSymbol = this.options.language.sort_none,
                    _orderDir = 0;

                if (typeof column.initialSort != "undefined") {
                    if (column.initialSort == "asc") {
                        sortSymbol = this.options.language.sort_asc;
                        _orderDir = 1;
                    }
                    else if (column.initialSort == "desc") {
                        sortSymbol = this.options.language.sort_desc;
                        _orderDir = 2;
                    }
                }

                var lnkS = document.createElement('a');
                lnkS.href = 'javascript:void(0);';                
                var sorter = $(lnkS);
                sorter.html(sortSymbol);
                
                th.append(sorter);

                if (typeof column.sortColumn != "undefined")
                    lnkS.sortColumn = column.sortColumn;
                else
                    lnkS.sortColumn = column.dataColumn;

                if (typeof column.initialSort != "undefined") {
                    this.sortColumns[lnkS.sortColumn] = column.initialSort;
                    lnkS.orderDir = _orderDir;
                }

                var self = this;
                sorter.click(function () {
                    if (!this.orderDir || this.orderDir == 0) {
                        self.sortColumns[this.sortColumn] = "asc";
                        this.orderDir = 1;
                        sorter.html(self.options.language.sort_asc);
                    }
                    else if (this.orderDir == 1) {
                        self.sortColumns[this.sortColumn] = "desc";
                        this.orderDir = 2;
                        sorter.html(self.options.language.sort_desc);
                    }
                    else {
                        self.sortColumns[this.sortColumn] = "none";
                        this.orderDir = 0;
                        sorter.html(self.options.language.sort_none);
                    }
                    self.search(false);
                });
            }
            
            if(typeof column.caption != "undefined"){
                th.append(document.createTextNode(column.caption));
            }else{
                th.append(document.createTextNode(headerName));
            }            

            if (typeof column.headerStyle != "undefined") {
                th.css(column.headerStyle);
            }

            if (typeof column.headerClass != "undefined") {
                th.addClass(column.headerClass);
            }

            if (typeof column.afterHeaderCreated != "undefined") {
                column.afterHeaderCreated(th);
            }
        },

        createRow: function(body, item){
            if (typeof item != 'function') {

                var trEl = document.createElement('tr');
                trEl.dataRow = item;
                
                var tr = $(trEl);
                body.append(tr);

                for (var headerName in this.columns) {
                    this.createColumn(tr, item, this.columns[headerName], headerName);
                }
            }
        },

        createColumn: function(tr, item, column, headerName){
            var td = $(document.createElement('td')),
                findData = /(\${)(\w*)(})/gi;

            tr.append(td);

            if (typeof column.rowTemplate != "undefined") {
                var template = column.rowTemplate;
                var data = template.match(findData);

                for (var idd = 0; idd < data.length; idd++) {
                    var dataName = data[idd].replace(findData, "$2");
                    var dataValue = column.formatFunction(item, item[dataName], dataName);
                    var rAux = new RegExp("(\\${)(" + dataName + ")(})", "gi");
                    template = template.replace(rAux, dataValue);
                }
                td.append($(template));
            }
            else if (typeof column.dataColumn != "undefined") {
                var dataValue = null;
                try {
                    dataValue = column.formatFunction(item, item[column.dataColumn], column.dataColumn);
                } catch (e) {
                    if (item[column.dataColumn] != undefined) {
                        dataValue = item[column.dataColumn].toString();
                    }
                    else {
                        dataValue = "";
                    }
                }
                td.append(dataValue);
            }

            if (typeof column.showDetailRow != "undefined") {
                td.click(function () {
                    if (!this.isShowDetail) {
                        this.isShowDetail = true;

                        var dtTr = document.createElement('tr'),
                            dtTd = document.createElement('td');
                        dtTr.appendChild(dtTd);
                        dtTd.colSpan = self.columnsCount;

                        var detail = $(dtTr);
                        tr.after(detail);                        
                        column.showDetailRow(dtTd, tr, function () {
                            detail.remove();
                            td.isShowDetail = false;
                        });
                    }
                });
            }

            if (typeof column.style != "undefined") {
                td.css(column.style);
            }

            if (typeof column.className != "undefined")
                td.addClass(column.className);

            if (typeof column.afterCreated != "undefined") {
                column.afterCreated(item, td);
            }
        },

        createGrid: function(list, header, body){
            this.createHeader(header);
            for (var idxl in list) {
                var item = list[idxl];
                this.createRow(body, item);
            }
        },
                
        /*Setar o total de linhas*/
        setTotalRows: function (totalRows) {
            self.totalRows = totalRows;

            if (self.totalRows == 0) {
                self.showEmptyDataMessage();
            }
            else {
                self.options.search(self.page - 1, self.pageSize, self.getSortExpression(), self.binder);
            }
        },

        getSortExpression: function () {
            var sortExpression = "";
            var addComma = false;

            for (var sortColumn in this.sortColumns) {

                var direction = this.sortColumns[sortColumn];

                if (direction != 'none') {
                    if (addComma) {
                        sortExpression += ",";
                    }
                    else {
                        addComma = true;
                    }
                    sortExpression += (sortColumn + " " + direction);
                }
            }

            return sortExpression;
        },
                
        /*Criação do paginador*/
        paginate: function (footer) {
            if (!this.options.drawFooter) return;
             
            var ftTr = document.createElement('tr'),
                ftTd = document.createElement('td');
            ftTd.colSpan = this.columnsCount;
            ftTr.appendChild(ftTd);

            footer.html("").append(ftTr);

            this.createPages(ftTd);

            this.createPaginateSelect(ftTd);            

            this.createSumary(ftTd);
        },

        createPaginateSelect: function (td) {
            if (this.options.drawSelectPageSize) {
                /*Criação do seletor de tamanho de página*/
                var pgSelect = document.createElement("select");
                this.dropdownSize = $(pgSelect);
                this.dropdownSize.change(function () {
                    self.pageSize = $(this).val();
                    self.resetPageValues();
                    self.paginate($(self.element).find('tfoot'));
                    if (self.search) {
                        self.search(false);
                    }
                });

                var idxOpt = 0,
                    len = this.options.pageSizeOptions.length;

                for (; idxOpt < len; idxOpt++) {
                    var sizeOpt = this.options.pageSizeOptions[idxOpt];
                    if (typeof sizeOpt != 'function') {
                        var opt = document.createElement('option');
                        opt.value = sizeOpt;
                        opt.text = sizeOpt;
                        pgSelect.appendChild(opt);                        

                        if (sizeOpt == this.pageSize) {
                            pgSelect.selectedIndex = idxOpt;
                        }
                    }
                }

                //Begin DropDownSize Add 
                var _divTmp = document.createElement('div'),
                    msgDdl = document.createElement('span');

                _divTmp.className = 'gfy-Tmp';
                _divTmp.style.float = 'left';                
                msgDdl.appendChild(document.createTextNode(this.options.language.itensPerPageMessage));

                _divTmp.appendChild(msgDdl);
                _divTmp.appendChild(pgSelect);

                td.appendChild(_divTmp);
                //End DropDownSize
            }
        },

        createPages: function (td) {
            if (this.options.drawPages) {

                this.divPagging = $(td).find(".gfy-pg");

                if (this.divPagging.length != 0) {
                    this.divPagging.html("");
                } else {
                    var divAux = document.createElement('div');
                    divAux.className = 'gfy-pg';
                    divAux.style.float = 'left';
                    this.divPagging = $(divAux);
                    td.appendChild(divAux);
                }

                var divFirst = document.createElement('div'),
                    divUl = document.createElement('div'),
                    divLast = document.createElement('div'),
                    first = document.createElement('a'),
                    previous = document.createElement('a'),
                    last = document.createElement('a'),
                    next = document.createElement('a'),
                    ulPages = document.createElement('ul');

                divFirst.className = 'gfyDivFirst';
                divUl.className = 'gfyRollover';
                divLast.className = 'gfyDivLast';

                first.className = 'gfyFirst';
                first.href = 'javascript:void(0);';                
                first.innerHTML = this.options.language.page_first;

                previous.className = 'gfyPrevious';
                previous.href = 'javascript:void(0);';
                previous.innerHTML = this.options.language.page_previous;

                divFirst.appendChild(first);
                divFirst.appendChild(previous);

                last.className = 'gfyLast';
                last.href = 'javascript:void(0);';
                last.innerHTML = this.options.language.page_last;

                next.className = 'gfyNext';
                next.href = 'javascript:void(0);';
                next.innerHTML = this.options.language.page_next;

                divLast.appendChild(next);
                divLast.appendChild(last);

                ulPages.className = 'gfyPages';
                divUl.appendChild(ulPages);

                this.divPagging.append(divFirst);
                this.divPagging.append(divUl);
                this.divPagging.append(divLast);

                $(first).click(function () {
                    self.selectPage(1);
                });

                var pg_scroll_interval;
                $(previous).click(function () {
                    if (self.page > 1)
                        self.selectPage(self.page - 1);
                })
                .hover(
                    function () {
                        pg_scroll_interval = setInterval(function () {
                                var left = $(divUl).scrollLeft() - 2;
                                $(divUl).scrollLeft(left);
                            }, 20);
                    },
                    function () {
                        clearInterval(pg_scroll_interval);
                    }
                );

                $(next).hover(
                    function () {
                        pg_scroll_interval = setInterval(function () {
                                var left = $(divUl).scrollLeft() + 2;
                                $(divUl).scrollLeft(left);
                            }, 20);
                    },
                    function () {
                        clearInterval(pg_scroll_interval);
                    }
                );

                $(first).hover(
                    function () {
                        pg_scroll_interval = setInterval(function () {
                                var left = $(divUl).scrollLeft() - 10;
                                $(divUl).scrollLeft(left);
                            }, 20);
                    },
                    function () {
                        clearInterval(pg_scroll_interval);
                    }
                );

                $(last).hover(
                    function () {
                        pg_scroll_interval = setInterval(function () {
                                var left = $(divUl).scrollLeft() + 10;
                                $(divUl).scrollLeft(left);
                            }, 20);
                    },
                    function () {
                        clearInterval(pg_scroll_interval);
                    }
                );

                var aux = this.totalRows / this.pageSize,
                    qtt = parseInt(aux),
                    idxPg = 1;

                if (qtt < aux)
                    qtt++;
                for (; idxPg <= qtt; idxPg++) {
                    var li = document.createElement('li');
                    li.id = 'lpg' + idxPg;
                    li.appendChild(document.createTextNode(idxPg));
                    (function(li, idxPg, self){
                        $(li).click(function () {
                            self.selectPage(idxPg);
                        });
                    })(li, idxPg, self);                    
                    ulPages.appendChild(li);
                }

                $(next).click(function () {
                    if (self.page < qtt)
                        self.selectPage(self.page + 1);
                });

                $(last).click(function () {
                    self.selectPage(qtt);
                });

                /*Begin - Start calc ul pages width */
                var lenghtPages = 0,
                    qttItems = qtt,
                    itSize = 19,
                    itDec = 9;

                while (qttItems > 0) {
                    if (qttItems > itDec) {
                        lenghtPages += (itDec * itSize);
                    }
                    else {
                        lenghtPages += (qttItems * itSize);
                    }

                    qttItems -= itDec;
                    itDec *= 10;
                    itSize += 7;
                }
                /*End - Start calc ul pages width */

                $(ulPages).find("#lpg" + this.page).toggleClass("selectedPg");

                ulPages.style.width = lenghtPages < 256 ? '256px' : lenghtPages + 'px';

                this.divPagging.css("margin-left", -(this.divPagging.width() / 2));

                var scrollTo = $(divUl).find("#lpg" + this.page).offset().left - $(divUl).offset().left;
                $(divUl).scrollLeft(scrollTo - 80);
            }
        },

        createSumary: function (td) {
            if (!this.options.drawSumary) return;            

            var divNumbers = $(td).find(".gdySumary")
            if (divNumbers.length == 0) {
                var aux = document.createElement('div');
                aux.className = 'gdySumary';
                aux.style.float = 'right';
                td.appendChild(aux);

                divNumbers = $(aux);
            }
            else {
                divNumbers.html("");
            }
            var total = this.toRow < this.totalRows ? this.toRow : this.totalRows;

            var sumary = this.options.language.sumary.replace(/({fromRow})/gi, this.fromRow)
                .replace(/({toRow})/gi, total)
                .replace(/({totalRows})/gi, this.totalRows);
            var span = document.createElement('span');
            span.appendChild(document.createTextNode(sumary));
            
            divNumbers.append(span);
        },

        /* Seleção de Página */
        selectPage: function (page) {
            $("#lpg" + this.page).toggleClass("selectedPg");
            this.page = page;
            var pgAux = page - 1;
            this.fromRow = (this.pageSize * pgAux) + 1;
            this.toRow = (this.pageSize * (pgAux + 1));
            if (this.toRow > this.totalRows)
                this.toRow = this.totalRows;

            var ftTd = $(this.element).find('tfoot tr td');
            this.createSumary(ftTd);

            var newLiPg = $("#lpg" + this.page),
                divUl = $(this.element).find('.gfyRollover');
            
            newLiPg.toggleClass("selectedPg");
            
            divUl.scrollLeft(0);
            var scrollTo = newLiPg.offset().left - divUl.offset().left;
            divUl.scrollLeft(scrollTo - 80);

            if (this.search) {
                this.search(false);
            }
        },

        showEmptyDataMessage: function () {
            $(this.element).html("<tr><td>" + this.options.language.emptyDataMessage + "</td></tr>");
        },
        
        /* Alimentação da Estrutura da Página */
        binder: function (result) {
            var list;
            if (typeof (result) == "string"){
                if(typeof(JSON) != 'undefined'){
                    list = JSON.parse(result);
                }else{
                    list = eval("(" + result + ")");
                }
            } else {
                list = result;
            }
            
            var jEl = $(self.element),
                header = jEl.find('thead'),
                body = jEl.find('tbody'),
                footer = jEl.find('tfoot');

            body.html("");

            if (self.columns !== undefined && typeof (self.columns) == 'object') {
                self.createGrid(list, header, body);                
            }
            else {
                $(self.options.language.templateRow).tmpl(list).appendTo(body);
            }

            /* Definições de cor*/
            body.find("tr:even").addClass('gdyEven');
            body.find("tr:odd").addClass('gdyOdd');
            
            body.find("tr").hover(function () {
                $(this).toggleClass("selectRowGdy");
            })
            /* Seleção de Row*/
            .click(function () {
                var row = $(this);
                var item = this.dataRow;
                self.selectedRow = jEl.find("tr").index(row);
                row.rebinder = function (result) {
                    row.html($(self.options.templateRow).tmpl(list).find("td"));
                };
                self.options.onSelectRow(self.selectedRow, row, row.rebinder, item);
            });

            self.paginate(footer);
            footer.show();

            if (typeof self.divPagging != 'undefined') {
                window.setTimeout(function () {
                    self.divPagging.css("margin-left", -(self.divPagging.width() / 2));
                }, 100);
            }
        },
        
        /* Busca novos dados */
        search: function (newSearch) {
            if (newSearch) {
                this.options.getTotalRows(this.setTotalRows);
            }
            else {
                this.options.search(this.page - 1, this.pageSize, this.getSortExpression(), this.binder);
            }
        }
    };

    $.fn[pluginName] = function (options, columns, language) {
        return this.each(function () {
            $.data(this, "plugin_" + pluginName, new Gridify(this, options, columns, language));
        });
    };

})(window.jQuery, window, document);