/*
Gridify - 2013
Created by: Luís Fernando Vendrame
*/
'use strict';
(function(){

    const defaults = {
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
        },
        defaults_language = {
            sumary: "Exibindo de {fromRow} até {toRow} de um total de {totalRows}",
            itensPerPageMessage: "Itens exibidos por página: ",
            emptyDataMessage: "Nenhum registro foi encontrado.",
            page_previous: "&lt;",
            page_next: "&gt;",
            page_first: "&lt;&lt;",
            page_last: "&gt;&gt;",
            sort_none: "↕",
            sort_asc: "↓",
            sort_desc: "↑"
        };

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



    function Gridify(elementSelector, options, columns, language) {
        this.elementSelector = elementSelector;
        this.container = document.querySelector(this.elementSelector);
        this.options = Object.assign({}, defaults, options);
        this.options.language = Object.assign({}, defaults_language, language);
        this.columns = columns;

        this._defaults = defaults;

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
            const table = this.container;

            let header = table.querySelector("thead");
            if (!header) {
                header = document.createElement("thead");
                table.appendChild(header);
            } else {
                header.removeAttribute('isInitialized');
            }            

            let body = table.querySelector("tbody");
            if (!body) {
                body = document.createElement("tbody");
                table.appendChild(body);
            }

            let footer = table.querySelector("tfoot");
            if (!footer) {
                footer = document.createElement("tfoot");
                table.appendChild(footer);
            } else {
                footer.querySelector("tr td").innerHTML = "";
            }

            table.classList.add('tblGdy');
            this.search(true);
        },

        //create header
        createHeader: function(header){
            if (!header.getAttribute('isInitialized')) {
                !header.setAttribute('isInitialized', true);
                header.innerHTML = "";

                const tr = document.createElement("tr");
                this.columnsCount = 0;

                for (var headerName in this.columns) {
                    tr.appendChild(
                        this.createHeaderColumn(this.columns[headerName], headerName)
                    );
                    this.columnsCount++;
                }
                header.appendChild(tr);
            }
        },

        createHeaderColumn: function(column, headerName){
            
            const th = document.createElement("th");
            const dataColumn = column.dataColumn || headerName;

            if (!column.formatFunction){
                column.formatFunction = (item, data, dataName) => data && data.toString() || "";
            }

            if ((this.options.autoSort && dataColumn) || column.sortColumn) {

                let sortSymbol = this.options.language.sort_none,
                    _orderDir = 0;
                
                if (column.initialSort === "asc") {
                    sortSymbol = this.options.language.sort_asc;
                    _orderDir = 1;
                } else if (column.initialSort === "desc") {
                    sortSymbol = this.options.language.sort_desc;
                    _orderDir = 2;
                }

                const sortLink = document.createElement('a');
                sortLink.href = 'javascript:void(0);';
                sortLink.textContent = sortSymbol;
                th.appendChild(sortLink);

                sortLink.sortColumn = column.sortColumn || dataColumn;

                if (column.initialSort) {
                    this.sortColumns[sortLink.sortColumn] = column.initialSort;
                    sortLink.orderDir = _orderDir;
                }

                sortLink.addEventListener('click', () => {
                    if (!sortLink.orderDir || sortLink.orderDir == 0) {
                        this.sortColumns[sortLink.sortColumn] = "asc";
                        sortLink.orderDir = 1;
                        sortLink.textContent = this.options.language.sort_asc;
                    } else if (sortLink.orderDir == 1) {
                        this.sortColumns[sortLink.sortColumn] = "desc";
                        sortLink.orderDir = 2;
                        sortLink.textContent = this.options.language.sort_desc;
                    } else {
                        this.sortColumns[sortLink.sortColumn] = "none";
                        sortLink.orderDir = 0;
                        sortLink.textContent = this.options.language.sort_none;
                    }
                    this.search(false);
                });
            }

            th.appendChild(document.createTextNode(column.caption || headerName));

            if (column.headerStyle) {
                th.style.cssText = column.headerStyle;
            }

            if (column.headerClass) {
                th.classList.add(column.headerClass);
            }

            if (column.afterHeaderCreated) {
                column.afterHeaderCreated(th);
            }

            return th;
        },

        createGrid: function(list, header, body){
            this.createHeader(header);

            list.forEach(item => {
                const row = this.createRow(item);
                row && body.appendChild(row);
            });
        },

        createRow: function(item){
            if (typeof item !== 'function') {

                const tr = document.createElement('tr');
                tr.dataRow = item;

                for (let headerName in this.columns) {
                    tr.appendChild(
                        this.createColumn(item, this.columns[headerName], headerName, tr)
                    );                    
                }

                return tr;
            }
        },

        createColumn: function(item, column, headerName, parent){
            const td = document.createElement('td'),
                  findData = /\${(\w+)}/gi;

            if (column.rowTemplate) {
                let template = column.rowTemplate;
                const matchs = template.match(findData);

                template = matchs.reduce((template, data) => {
                    var dataName = data[idd].replace(findData, "$1");
                    var dataValue = column.formatFunction(item, item[dataName], dataName);
                    var rAux = new RegExp("(\\${)(" + dataName + ")(})", "gi");
                    return template.replace(rAux, dataValue);
                }, template);

                for (var idd = 0; idd < data.length; idd++) {
                    var dataName = data[idd].replace(findData, "$1");
                    var dataValue = column.formatFunction(item, item[dataName], dataName);
                    var rAux = new RegExp("(\\${)(" + dataName + ")(})", "gi");
                    template = template.replace(rAux, dataValue);
                }

                td.innerHTML = template;
            } else if (column.dataColumn || headerName) {
                const key = column.dataColumn || headerName;
                let dataValue = null;
                try {
                    dataValue = column.formatFunction(item, item[key], key);
                } catch (e) {
                    if (item[key]) {
                        dataValue = item[key].toString();
                    } else {
                        dataValue = "";
                    }
                }
                td.innerHTML = dataValue;
            }

            if (column.showDetailRow) {
                td.addEventListener('click', () => {
                    if (!td.isShowDetail) {
                        td.isShowDetail = true;

                        const dtTr = document.createElement('tr'),
                              dtTd = document.createElement('td');
                        
                        dtTr.appendChild(dtTd);
                        dtTd.colSpan = this.columnsCount;

                        parent.parentNode.insertBefore(dtTr, parent);
                        column.showDetailRow(dtTd, parent, () => {
                            dtTr.remove();
                            td.isShowDetail = false;
                        });
                    }
                });
            }

            if (column.style) {
                td.style.cssText = column.style;
            }

            if (column.className){
                td.classList.add(column.className);
            }

            if (column.afterCreated) {
                column.afterCreated(item, td);
            }

            return td;
        },
                
        /*Setar o total de linhas*/
        setTotalRows: function (totalRows) {
            this.totalRows = totalRows;

            if (this.totalRows == 0) {
                this.showEmptyDataMessage();
            } else {
                this.options.search(this.page - 1, this.pageSize, this.getSortExpression())
                    .then(data => this.render(data));
            }
        },

        getSortExpression: function () {
            return Object.keys(this.sortColumns)
                .filter(key => this.sortColumns[key] != 'none')
                .map(key => key + " " + this.sortColumns[key])
                .join(",");
        },
                
        /*Criação do paginador*/
        paginate: function (footer) {
            if (!this.options.drawFooter) return;
                
            const ftTr = document.createElement('tr'),
                  ftTd = document.createElement('td');

            ftTd.colSpan = this.columnsCount;
            ftTr.appendChild(ftTd);

            footer.innerHTML = "";
            footer.appendChild(ftTr);

            this.createPages(ftTd);

            this.createPaginateSelect(ftTd);            

            this.createSumary(ftTd);
        },

        createPaginateSelect: function (td) {
            if (this.options.drawSelectPageSize) {
                /*Criação do seletor de tamanho de página*/
                this.dropdownSize = document.createElement("select");
                this.dropdownSize.addEventListener('change', () => {
                    this.pageSize = parseInt(this.dropdownSize.options[this.dropdownSize.selectedIndex].value);

                    this.resetPageValues();
                    this.paginate(this.container.querySelector('tfoot'));
                    if (this.search) {
                        this.search(false);
                    }
                });

                this.options.pageSizeOptions.forEach((sizeOption, index) => {
                    if (typeof sizeOption != 'function') {
                        const option = document.createElement('option');
                        option.value = sizeOption;
                        option.text = sizeOption;
                        this.dropdownSize.appendChild(option);                        

                        if (sizeOption == this.pageSize) {
                            this.dropdownSize.selectedIndex = index;
                        }
                    }                    
                });

                //Begin DropDownSize Add 
                const _divTmp = document.createElement('div'),
                      msgDdl = document.createElement('span');

                _divTmp.className = 'gfy-Tmp';
                _divTmp.style.float = 'left';                
                msgDdl.appendChild(document.createTextNode(this.options.language.itensPerPageMessage));

                _divTmp.appendChild(msgDdl);
                _divTmp.appendChild(this.dropdownSize);

                td.appendChild(_divTmp);
                //End DropDownSize
            }
        },

        createPages: function (td) {
            if (this.options.drawPages) {

                this.divPagging = td.querySelector('.gfy-pg');

                if (this.divPagging) {
                    this.divPagging.innerHTML = "";
                } else {
                    this.divPagging = document.createElement('div');
                    this.divPagging.className = 'gfy-pg';
                    this.divPagging.style.float = 'left';
                    td.appendChild(this.divPagging);
                }

                const divFirst = document.createElement('div'),
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

                this.divPagging.appendChild(divFirst);
                this.divPagging.appendChild(divUl);
                this.divPagging.appendChild(divLast);

                first.addEventListener('click', () => this.selectPage(1));

                previous.addEventListener('click', () => {
                    if (this.page > 1) {                        
                        this.selectPage(this.page - 1);
                    }
                });

                function addScrollControl(element, leftValue) {
                    let pg_scroll_interval;

                    element.addEventListener('mouseenter', () => {
                        pg_scroll_interval = setInterval(() => {
                            const left = divUl.scrollLeft + leftValue;
                            divUl.scrollTo(0, left);
                        }, 20);
                    });
                    
                    element.addEventListener('mouseleave ', () => clearInterval(pg_scroll_interval));
                }

                addScrollControl(previous, -2);
                
                addScrollControl(next, 2);

                addScrollControl(first, -10);

                addScrollControl(last, 10);

                const aux = this.totalRows / this.pageSize;
                let qtt = parseInt(aux),
                    idxPg = 1;

                if (qtt < aux){
                    qtt++;
                }

                for (; idxPg <= qtt; idxPg++) {
                    const li = document.createElement('li');
                    li.className = 'lpg' + idxPg;
                    li.appendChild(document.createTextNode(idxPg));
                    
                    (function(self, idxPg){
                        li.addEventListener('click', () => self.selectPage(idxPg));
                    })(this, idxPg);

                    ulPages.appendChild(li);
                }

                next.addEventListener('click', () => {
                    if (this.page < qtt){
                        this.selectPage(this.page + 1);
                    }
                });

                last.addEventListener('click', () => {
                    this.selectPage(qtt);
                });

                /*Begin - Start calc ul pages width */
                let lenghtPages = 0,
                    qttItems = qtt,
                    itSize = 19,
                    itDec = 9;

                while (qttItems > 0) {
                    if (qttItems > itDec) {
                        lenghtPages += (itDec * itSize);
                    } else {
                        lenghtPages += (qttItems * itSize);
                    }

                    qttItems -= itDec;
                    itDec *= 10;
                    itSize += 7;
                }
                /*End - Start calc ul pages width */

                ulPages.querySelector(".lpg" + this.page).classList.toggle("selectedPg");

                ulPages.style.width = lenghtPages < 256 ? '256px' : lenghtPages + 'px';

                this.divPagging.style.marginLeft = (-(this.divPagging.width / 2)) + 'px';

                const scrollTo = divUl.querySelector(".lpg" + this.page).offsetLeft - divUl.offsetleft;
                divUl.scrollTo(0, scrollTo - 80);
            }
        },

        createSumary: function (td) {
            if (!this.options.drawSumary) return;            

            let divNumbers = td.querySelector(".gdySumary");
            if (!divNumbers) {
                divNumbers = document.createElement('div');
                divNumbers.className = 'gdySumary';
                divNumbers.style.float = 'right';
                td.appendChild(divNumbers);
            } else {
                divNumbers.innerHTML = "";
            }
            const total = this.toRow < this.totalRows ? this.toRow : this.totalRows;

            const sumary = this.options.language.sumary
                .replace(/({fromRow})/gi, this.fromRow)
                .replace(/({toRow})/gi, total)
                .replace(/({totalRows})/gi, this.totalRows);

            const span = document.createElement('span');
            span.appendChild(document.createTextNode(sumary));
            
            divNumbers.appendChild(span);
        },

        /* Seleção de Página */
        selectPage: function (page) {
            this.container.querySelector(".lpg" + this.page).classList.toggle("selectedPg");

            this.page = page;
            const pgAux = page - 1;
            this.fromRow = (this.pageSize * pgAux) + 1;
            this.toRow = (this.pageSize * (pgAux + 1));
            if (this.toRow > this.totalRows)
                this.toRow = this.totalRows;

            const ftTd = this.container.querySelector('tfoot tr td');
            this.createSumary(ftTd);

            const newLiPg = this.container.querySelector(".lpg" + this.page),
                  divUl = this.container.querySelector('.gfyRollover');
            
            newLiPg.classList.toggle("selectedPg");
            
            divUl.scrollTo(0, 0);
            var scrollTo = newLiPg.offsetLeft - divUl.offsetLeft;
            divUl.scrollTo(0, scrollTo - 80);

            if (this.search) {
                this.search(false);
            }
        },

        showEmptyDataMessage: function () {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.appendChild(document.createTextNode(this.options.language.emptyDataMessage));
            row.appendChild(cell);
            
            this.container.innerHTML = "";
            this.container.appendChild(row);
        },
        
        /* Alimentação da Estrutura da Página */
        render: function (result) {
            let list;
            if (typeof (result) == "string"){
                if(typeof(JSON) != 'undefined'){
                    list = JSON.parse(result);
                }else{
                    list = eval("(" + result + ")");
                }
            } else {
                list = result;
            }
            
            const header = this.container.querySelector('thead'),
                  body = this.container.querySelector('tbody'),
                  footer = this.container.querySelector('tfoot');

            body.innerHTML = "";

            if (this.columns && typeof (this.columns) === 'object') {
                this.createGrid(list, header, body);                
            } else {
                this.processTemplate(body, this.options.language.templateRow, list);
            }

            /* Definições de cor*/
            body.querySelectorAll("tr:nth-child(even)").forEach(function(el){ el.classList.add('gdyEven'); });
            body.querySelectorAll("tr:nth-child(odd)").forEach(function(el){ el.classList.add('gdyOdd'); });
                        
            body.querySelectorAll("tr").forEach(function(row){
                function toggleClass(){
                    row.classList.toggle("selectRowGdy");
                }

                row.addEventListener("mouseenter", toggleClass);
                row.addEventListener("mouseleave", toggleClass);
                
                row.addEventListener("click", function () {
                    const item = row.dataRow;
                    this.selectedRow = Array.prototype.indexOf.call(this.container.querySelector("tr").children, row);

                    row.rerender = (result) => {
                        const dummy = document.createElement("table");
                        this.processTemplate(dummy, this.options.templateRow, data);
    
                        row.innerHTML = "";
                        row.appendChild(dummy.querySelector("td").cloneNode(true));
                    };

                    this.options.onSelectRow(this.selectedRow, row, row.rerender, item);
                });
            });

            this.paginate(footer);

            if (this.divPagging) {

                window.setTimeout(() => {
                    this.divPagging.style.marginLeft =  "" + (-(this.divPagging.width / 2));
                }, 100);
            }
        },

        processTemplate: function(container, template, data){
            container.innerHTML = data.reduce(function(content, item) {
                return content + processTemplateLine(template, item);
            }, "");
        },

        processTemplateLine: function(template, item){            
            return Object.keys(item)
                .reduce(function(processingText, key){
                    return processingText.replace("${" + key + "}", item[key]);
                }, template);
        },
        
        /* Busca novos dados */
        search: function (newSearch) {
            if (newSearch) {
                this.options.getTotalRows()
                    .then(data => this.setTotalRows(data));
            } else {
                this.options.search(this.page - 1, this.pageSize, this.getSortExpression())
                    .then(data => this.render(data));
            }
        }
    };

    window.Gridify = Gridify;

})();

