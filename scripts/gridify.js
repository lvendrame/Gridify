/*
    Gridify - 2012
    Create by: Luís Fernando Vendrame
*/
(function ($) {
    $.fn.Gridify = function (options, columns) {

        var defaults = {
            search: function (page, pageSize, sortExpression, binder) { },
            getTotalRows: function (setTotalRows) { },
            initialPageSize: 15,
            templateRow: null,
            autoSort: true,
            pageSizeOptions: [5, 10, 15, 25, 50],
            onSelectRow: function (rowIndex, row, redrawRow) { },
            lang: {
                sumary: "Exibindo de {fromRow} até {toRow} de um total de {totalRows}",
                itensPerPageMessage: "Itens exibidos por página: ",
                emptyDataMessage: "Nenhum registro foi encontrado."
            }
        };

        //(^\${)(\w*)(})

        var settings = $.extend({}, defaults, options);


        //        columns{
        //            "header"{
        //                headerStyle: {backgroundColor:"#fff", heigth: "35px"},
        //                headerClass: "",
        //                rowTemplate: "<a href='pagina.aspx?codigo=${codigo}'>Editar</a>",
        //                formatFunction: function(item, data, dataName){ return data.toString(); },
        //                dataColumn: "nomeCampo",
        //                sortColumn: "nomeCampo",
        //                showDetailRow: function(detail, row, closeDetail){ detail.append("<span>Detalhes</span>")},
        //                style: {backgroundColor:"#fff", heigth: "35px"},
        //                class: ""
        //            },
        //            "header 2"{
        //                rowTemplate: "<a href='pagina.aspx?codigo=${codigo}'>Editar</a>",
        //                formatFunction: function(item, data, dataName){ return data.toString(); },
        //                dataColumn: "nomeCampo",
        //                sortColumn: "nomeCampo",
        //                showDetailRow: function(detail, row, closeDetail){ detail.append("<span>Detalhes</span>")},
        //                style: {backgroundColor:"#fff", heigth: "35px"},
        //                class: ""
        //            }
        //        }

        function processColumns(list, colsDef, table, header, body) {
            var findData = /(\${)(\w*)(})/gi;

            //create header
            if (!header.isInitialized) {
                header.isInitialized = true;
                header.html("");
                var tr = $("<tr></tr>");
                table.columnsCount = 0;
                for (var headerName in colsDef) {
                    var columnDef = colsDef[headerName];

                    if (!columnDef.formatFunction)
                        columnDef.formatFunction = function (item, data, dataName) { return data ? data.toString() : ""; };

                    var th = $("<th></th>");
                    tr.append(th);

                    if ((settings.autoSort && columnDef.dataColumn) || columnDef.sortColumn) {
                        var sorter = $("<a href='javascript:void(0);'>&#8597;</a>");
                        var lnkS = sorter.get(0);
                        th.append(sorter);

                        if (columnDef.sortColumn)
                            lnkS.sortColumn = columnDef.sortColumn;
                        else
                            lnkS.sortColumn = columnDef.dataColumn;

                        sorter.click(function () {
                            if (!this.orderDir || this.orderDir == 0) {
                                table.sortColumns[this.sortColumn] = "asc";
                                this.orderDir = 1;
                                $(this).html("&#9660;");
                            }
                            else if (this.orderDir == 1) {
                                table.sortColumns[this.sortColumn] = "desc";
                                this.orderDir = 2;
                                $(this).html("&#9650;");
                            }
                            else {
                                table.sortColumns[this.sortColumn] = "none";
                                this.orderDir = 0;
                                $(this).html("&#8597;");
                            }
                            table.search(false);
                        });
                    }

                    th.append(document.createTextNode(headerName));

                    if (columnDef.headerStyle) {
                        th.css(columnDef.headerStyle);
                    }

                    if (columnDef.headerClass) {
                        th.addClass(columnDef.headerClass);
                    }

                    table.columnsCount++;
                }
                header.append(tr);
            }

            for (var idxl in list) {
                var item = list[idxl];

                tr = $("<tr></tr>");
                for (var headerName in colsDef) {
                    var columnDef = colsDef[headerName];
                    var td = $("<td></td>");

                    if (columnDef.rowTemplate) {
                        var template = columnDef.rowTemplate;
                        var data = template.match(findData);

                        for (var idd = 0; idd < data.length; idd++) {
                            var dataName = data[idd].replace(findData, "$2");
                            var dataValue = columnDef.formatFunction(item, item[dataName], dataName);
                            var rAux = new RegExp("(\\${)(" + dataName + ")(})", "gi");
                            template = template.replace(rAux, dataValue);
                        }
                        td.append($(template));
                    }
                    else if (columnDef.dataColumn) {
                        var dataValue = null;
                        try {
                            dataValue = columnDef.formatFunction(item, item[columnDef.dataColumn], columnDef.dataColumn)
                        } catch (e) {
                            if (item[columnDef.dataColumn] != undefined) {
                                dataValue = item[columnDef.dataColumn].toString();
                            }
                            else {
                                dataValue = "";
                            }
                        }
                        td.append(dataValue);
                    }

                    if (columnDef.showDetailRow) {
                        td.click(function () {
                            var self = this;
                            if (!self.isShowDetail) {
                                self.isShowDetail = true;
                                var row = $(this).parent();
                                var detail = $("<tr><td colspan=\"" + table.columnsCount + "\"></td></tr>");
                                row.after(detail);
                                columnDef.showDetailRow(detail.find('td'), row, function () {
                                    detail.remove();
                                    self.isShowDetail = false;
                                });
                            }
                        });
                    }

                    if (columnDef.style) {
                        td.css(columnDef.style);
                    }

                    if (columnDef.class) {
                        td.addClass(columnDef.class);
                    }

                    tr.append(td);
                }
                body.append(tr);
            }

        }

        return this.each(function () {
            var table = $(this);
            var header = table.find("thead");
            if (header.length == 0) {
                header = $("<thead></thead>");
                table.append(header);
            }

            var body = table.find("tbody");
            if (body.length == 0) {
                body = $("<tbody></tbody>");
                table.append(body);
            }

            var footer = table.find("tfoot");
            if (footer.length == 0) {
                footer = $("<tfoot></tfoot>");
                table.append(footer);
            }

            /*Inicialização de valores*/
            table.addClass('tblGdy');
            table.pageSize = settings.initialPageSize;
            table.totalRows = 0;
            table.sortColumns = {};
            footer.find("tr td").html("");

            table.init = function () {
                table.page = 1;
                table.fromRow = 1;
                table.toRow = table.pageSize;
                table.selectedRow = -1;
            };

            table.init();

            //            var _divTmp = $("<div class='gfy-Tmp' style='float:left'></div>");
            //            var msgDdl = $("<span>" + settings.lang.itensPerPageMessage + "</span>");
            //            _divTmp.append(msgDdl).append(table.dropdownSize);
            //            footer.find("tr td").append(_divTmp);

            /*Setar o tatal de linhas*/
            table.setTotalRows = function (totalRows) {
                table.totalRows = totalRows;

                if (table.totalRows == 0) {
                    table.showEmptyDataMessage();
                }
                else {
                    settings.search(table.page - 1, table.pageSize, table.getSortExpression(), table.binder);
                }
            };

            table.getSortExpression = function () {
                var sortExpression = "";
                var addComma = false;

                for (var sortColumn in table.sortColumns) {

                    var direction = table.sortColumns[sortColumn];

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
            };

            /*Criação do paginador*/
            table.paginate = function () {

                footer.html("<tr><td colspan='" + table.columnsCount + "'></td></tr>");

                /*Criação do seletor de tamanho de página*/
                table.dropdownSize = $(document.createElement("select"));
                table.dropdownSize.change(function () {
                    table.pageSize = $(this).val();
                    table.init();
                    table.paginate();
                    if (table.search) {
                        table.search(false);
                    }
                });

                for (var idxOpt in settings.pageSizeOptions) {
                    var sizeOpt = settings.pageSizeOptions[idxOpt];
                    table.dropdownSize.append($('<option></option>').val(sizeOpt).html(sizeOpt));

                    if (sizeOpt == table.pageSize) {
                        table.dropdownSize.val(sizeOpt);
                    }
                }

                //DropDownSize - Add Begin
                var _divTmp = $("<div class='gfy-Tmp' style='float:left'></div>");
                var msgDdl = $("<span>" + settings.lang.itensPerPageMessage + "</span>");
                _divTmp.append(msgDdl).append(table.dropdownSize);
                footer.find("tr td").append(_divTmp);
                //DropDownSize - End

                var qtt = parseInt(table.totalRows / table.pageSize);
                if (qtt < (table.totalRows / table.pageSize))
                    qtt++;

                table.divPagging = footer.find(".gfy-pg");

                if (table.divPagging.length != 0) {
                    table.divPagging.html("");
                }
                else {
                    table.divPagging = $("<div class='gfy-pg' style='float:left'></div>");
                    footer.find("tr td").append(table.divPagging);
                }

                var first = $("<a class='gfyFirst' href='javascript:void(0);'>&lt;&lt;</a>");
                var last = $("<a class='gfyLast' href='javascript:void(0);'>&gt;&gt;</a>");
                var previous = $("<a class='gfyPrevious' href='javascript:void(0);'>&lt;</a>");
                var next = $("<a class='gfyNext' href='javascript:void(0);'>&gt;</a>");
                var ulPages = $("<ul class='gfyPages'></ul>");
                table.divPagging.append(first);
                table.divPagging.append(previous);
                table.divPagging.append(ulPages);
                table.divPagging.append(next);
                table.divPagging.append(last);

                first.click(function () {
                    table.selectPage(1);
                });
                previous.click(function () {
                    if (table.page > 1)
                        table.selectPage(table.page - 1);
                });
                for (var i = 1; i <= qtt; i++) {
                    var li = $("<li id='lpg" + i + "'>" + i + "</li>");
                    li.click(function () {
                        table.selectPage(parseInt($(this).html()));
                    });
                    ulPages.append(li);
                }
                next.click(function () {
                    if (table.page < qtt)
                        table.selectPage(table.page + 1);
                });
                last.click(function () {
                    table.selectPage(qtt);
                });

                ulPages.find("#lpg" + table.page).toggleClass("selectedPg");

                table.divPagging.css("margin-left", -(table.divPagging.width() / 2));

                table.createSumary();
            };

            table.createSumary = function () {
                var fr = footer.find("tr td");

                var divNumbers = fr.find(".gdySumary")
                if (divNumbers.length == 0) {
                    divNumbers = $("<div class='gdySumary' style='float:right'></div>");
                    fr.append(divNumbers);
                }
                else {
                    divNumbers.html("");
                }
                var total = table.toRow < table.totalRows ? table.toRow : table.totalRows;

                var sumary = settings.lang.sumary.replace(/({fromRow})/gi, table.fromRow)
                    .replace(/({toRow})/gi, total)
                    .replace(/({totalRows})/gi, table.totalRows);
                var span = $("<span></span>");
                span.append(document.createTextNode(sumary));
                divNumbers.append(span);
            };

            /* Seleção de Página */
            table.selectPage = function (page) {
                $("#lpg" + table.page).toggleClass("selectedPg");
                table.page = page;
                var pgAux = page - 1;
                table.fromRow = (table.pageSize * pgAux) + 1;
                table.toRow = (table.pageSize * (pgAux + 1));
                if (table.toRow > table.totalRows)
                    table.toRow = table.totalRows;

                table.createSumary();

                $("#lpg" + table.page).toggleClass("selectedPg");
                if (table.search) {
                    table.search(false);
                }
            };

            table.showEmptyDataMessage = function () {
                table.html("<tr><td>" + settings.lang.emptyDataMessage + "</td></tr>");
            };

            /* Alimentação da Estrutura da Página */
            table.binder = function (result) {
                var lista;
                if (typeof (result) == "string")
                    lista = eval("(" + result + ")");
                else
                    lista = result;

                body.html("");

                if (columns !== undefined && typeof (columns) == 'object') {
                    processColumns(lista, columns, table, header, body);
                }
                else {
                    $(settings.templateRow).tmpl(lista).appendTo(body);
                }

                /* Definições de cor*/
                body.find("tr").hover(function () {
                    $(this).toggleClass("selectRowGdy");
                });

                body.find("tr:even").addClass('gdyEven');
                body.find("tr:odd").addClass('gdyOdd');

                /* Seleção de Row*/
                body.find("tr").click(function () {
                    var row = $(this);
                    table.selectedRow = table.find("tr").index(row);
                    row.rebinder = function (result) {
                        row.html($(settings.templateRow).tmpl(lista).find("td"));
                    };

                    settings.onSelectRow(table.selectedRow, row, row.rebinder);
                });

                table.paginate();
                footer.show();
            };

            /* Busca novos dados */
            table.search = function (newSearch) {
                if (newSearch) {
                    settings.getTotalRows(table.setTotalRows);
                }
                else {
                    settings.search(table.page - 1, table.pageSize, table.getSortExpression(), table.binder);
                }
            };

            table.search(true);

            this.table = table;
        });
    };
})(jQuery);