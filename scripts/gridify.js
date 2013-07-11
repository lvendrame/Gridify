/*
Gridify - 2012
Created by: Luís Fernando Vendrame
*/
; (function ($) {
    $.fn.Gridify = function (options, columns, lang) {

        var defaults = {
            search: function (page, pageSize, sortExpression, binder) { },
            getTotalRows: function (setTotalRows) { },
            initialPageSize: 15,
            templateRow: null,
            autoSort: true,
            pageSizeOptions: [5, 10, 15, 25, 50],
            onSelectRow: function (rowIndex, row, redrawRow) { },
            drawFooter: true,
            drawSelectPageSize: true,
            drawPages: true,
            drawSumary: true
        };

        var def_lang = {
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
        };

        //(^\${)(\w*)(})

        var settings = $.extend({}, defaults, options);
        var language = $.extend({}, def_lang, lang);

        settings.lang = language;


        //        columns{
        //            "header"{
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

                    if (typeof columnDef.formatFunction == "undefined")
                        columnDef.formatFunction = function (item, data, dataName) { return typeof data != "undefined" && data != null ? data.toString() : ""; };

                    var th = $("<th></th>");
                    tr.append(th);

                    if ((settings.autoSort && typeof columnDef.dataColumn != "undefined") || typeof columnDef.sortColumn != "undefined") {

                        var sortSymbol = settings.lang.sort_none;
                        var _orderDir = 0;
                        if (typeof columnDef.initialSort != "undefined") {
                            if (columnDef.initialSort == "asc") {
                                sortSymbol = settings.lang.sort_asc;
                                _orderDir = 1;
                            }
                            else if (columnDef.initialSort == "desc") {
                                sortSymbol = settings.lang.sort_desc;
                                _orderDir = 2;
                            }
                        }

                        var sorter = $("<a href='javascript:void(0);'>" + sortSymbol + "</a>");
                        var lnkS = sorter.get(0);
                        th.append(sorter);

                        if (typeof columnDef.sortColumn != "undefined")
                            lnkS.sortColumn = columnDef.sortColumn;
                        else
                            lnkS.sortColumn = columnDef.dataColumn;

                        if (typeof columnDef.initialSort != "undefined") {
                            table.sortColumns[lnkS.sortColumn] = columnDef.initialSort;
                            lnkS.orderDir = _orderDir;
                        }

                        sorter.click(function () {
                            if (!this.orderDir || this.orderDir == 0) {
                                table.sortColumns[this.sortColumn] = "asc";
                                this.orderDir = 1;
                                $(this).html(settings.lang.sort_asc);
                            }
                            else if (this.orderDir == 1) {
                                table.sortColumns[this.sortColumn] = "desc";
                                this.orderDir = 2;
                                $(this).html(settings.lang.sort_desc);
                            }
                            else {
                                table.sortColumns[this.sortColumn] = "none";
                                this.orderDir = 0;
                                $(this).html(settings.lang.sort_none);
                            }
                            table.search(false);
                        });
                    }

                    th.append(document.createTextNode(headerName));

                    if (typeof columnDef.headerStyle != "undefined") {
                        th.css(columnDef.headerStyle);
                    }

                    if (typeof columnDef.headerClass != "undefined") {
                        th.addClass(columnDef.headerClass);
                    }

                    table.columnsCount++;
                }
                header.append(tr);
            }

            for (var idxl in list) {
                var item = list[idxl];

                tr = $("<tr></tr>");
                tr.get(0).dataRow = item;
                for (var headerName in colsDef) {
                    var columnDef = colsDef[headerName];
                    var td = $("<td></td>");

                    if (typeof columnDef.rowTemplate != "undefined") {
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
                    else if (typeof columnDef.dataColumn != "undefined") {
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

                    if (typeof columnDef.showDetailRow != "undefined") {
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

                    if (typeof columnDef.style != "undefined") {
                        td.css(columnDef.style);
                    }

                        if (typeof columnDef.className != "undefined") 
                            td.addClass(columnDef.className);
                    
                    tr.append(td);

                    if (typeof columnDef.afterCreated != "undefined") {
                        columnDef.afterCreated(item, td);
                    }
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
                if (!settings.drawFooter) return;

                footer.html("<tr><td colspan='" + table.columnsCount + "'></td></tr>");

                if (settings.drawSelectPageSize) {
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

                    //Begin DropDownSize Add 
                    var _divTmp = $("<div class='gfy-Tmp' style='float:left'></div>");
                    var msgDdl = $("<span>" + settings.lang.itensPerPageMessage + "</span>");
                    _divTmp.append(msgDdl).append(table.dropdownSize);
                    footer.find("tr td").append(_divTmp);
                    //End DropDownSize
                }

                if (settings.drawPages) {
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

                    var divFirst = $("<div class='gfyDivFirst'></div>");
                    var divUl = $("<div class='gfyRollover'></div>");
                    var divLast = $("<div class='gfyDivLast'></div>");

                    var first = $("<a class='gfyFirst' href='javascript:void(0);'>" + settings.lang.page_first + "</a>");
                    var previous = $("<a class='gfyPrevious' href='javascript:void(0);'>" + settings.lang.page_previous + "</a>");
                    divFirst.append(first);
                    divFirst.append(previous);

                    var last = $("<a class='gfyLast' href='javascript:void(0);'>" + settings.lang.page_last + "</a>");
                    var next = $("<a class='gfyNext' href='javascript:void(0);'>" + settings.lang.page_next + "</a>");
                    divLast.append(next);
                    divLast.append(last);

                    var ulPages = $("<ul class='gfyPages'></ul>");
                    divUl.append(ulPages);

                    table.divPagging.append(divFirst);
                    table.divPagging.append(divUl);
                    table.divPagging.append(divLast);

                    first.click(function () {
                        table.selectPage(1);
                    });
                    previous.click(function () {
                        if (table.page > 1)
                            table.selectPage(table.page - 1);
                    });

                    previous.hover(
					function () {
					    previous_scroll_interval = setInterval(
							function () {
							    var left = divUl.scrollLeft() - 2;
							    divUl.scrollLeft(left);
							},
							20);
					},
					function () {
					    clearInterval(previous_scroll_interval);
					}
				);

                    next.hover(
					function () {
					    next_scroll_interval = setInterval(
							function () {
							    var left = divUl.scrollLeft() + 2;
							    divUl.scrollLeft(left);
							},
							20);
					},
					function () {
					    clearInterval(next_scroll_interval);
					}
				);

                    first.hover(
					function () {
					    previous_scroll_interval = setInterval(
							function () {
							    var left = divUl.scrollLeft() - 10;
							    divUl.scrollLeft(left);
							},
							20);
					},
					function () {
					    clearInterval(previous_scroll_interval);
					}
				);

                    last.hover(
					function () {
					    next_scroll_interval = setInterval(
							function () {
							    var left = divUl.scrollLeft() + 10;
							    divUl.scrollLeft(left);
							},
							20);
					},
					function () {
					    clearInterval(next_scroll_interval);
					}
				);

                    for (var i = 1; i <= qtt; i++) {
                        var li = $("<li id='lpg" + i + "'>" + i + "</li>");
                        li.click(function () {
                            table.selectPage(parseInt($(this).html()));
                        });
                        ulPages.append(li);
                    }

                    /*Begin - Start calc ul pages width */
                    var lenghtPages = 0;
                    var qttItems = qtt;
                    var itSize = 19;
                    var itDec = 9;
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

                    ulPages.css('width', lenghtPages < 256 ? '256px' : lenghtPages + 'px');
                    /*End - Start calc ul pages width */

                    var scrollTo = $("#lpg" + table.page).offset().left - divUl.offset().left;
                    divUl.scrollLeft(scrollTo - 80);

                    next.click(function () {
                        if (table.page < qtt)
                            table.selectPage(table.page + 1);
                    });
                    last.click(function () {
                        table.selectPage(qtt);
                    });

                    ulPages.find("#lpg" + table.page).toggleClass("selectedPg");

                    table.divPagging.css("margin-left", -(table.divPagging.width() / 2));
                }

                table.createSumary();
            };

            table.createSumary = function () {
                if (!settings.drawSumary) return;

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
                    var item = this.dataRow;
                    table.selectedRow = table.find("tr").index(row);
                    row.rebinder = function (result) {
                        row.html($(settings.templateRow).tmpl(lista).find("td"));
                    };
                    settings.onSelectRow(table.selectedRow, row, row.rebinder, item);
                });

                table.paginate();
                footer.show();

                if (typeof table.divPagging != 'undefined') {
                    window.setTimeout(function () {
                        table.divPagging.css("margin-left", -(table.divPagging.width() / 2));
                    }, 100);
                }
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