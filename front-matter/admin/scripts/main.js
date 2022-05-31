(function () {
    const allRepeaters = [
        'Static', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'
    ];
    let restaurants = {};
    function html2text(html) {
        return (html || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function html2url(html) {
        if (html.startsWith('http')) return encodeURI(html || '');
        return 'https://' + encodeURI(html || '');
    }
    function dow2Text(dow) {
        return allRepeaters[dow];
    }
    function restaurantTemplate(id, i) {
        const { dow, restaurant, source_url } = restaurants[id][i];
        const template = $(`
            <div id="restaurant${id}" data-id="${id}" class="col-xl-3 col-md-6 mb-4">
                <a href="#" class="restaurant restaurant-card list-group-item-action card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                    ${dow2Text(dow)}
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800 restaurant-name">${html2text(restaurant)}</div>
                            </div>
                            <div class="col-auto">
                                <img alt="" height="50" src="${html2url(source_url)}/favicon.ico" class="mr-2 rounded">
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `)
        template.on('click', () => previewRestaurant(template[0], restaurants[id], true))
        return template;
    }
    function menuDOWTemplate(record) {
        const id = $('#restaurantdetails').attr('data-id');
        if (!(id in restaurants)) restaurants[id] = record;
        const { dow, source_url, restaurant, extractor } = record;
        return $(`
            <li class="restaurant-selector row no-gutters list-group-item align-items-center">
                <div style="margin: -20px -34px 0 0;float: right; position: relative; z-index: 1" onclick="this.parentNode.classList.add('remove-restaurant');" class="row btn btn-danger btn-sm" tabindex="-1" role="button" aria-disabled="true">
                    <i class="fas fa-trash"></i>
                </div>
                <div class="col-auto">
                    <div class="row no-gutters align-items-center">
                        <div class="col-sm-2">
                            <select class="col-auto custom-select mr-1 mb-3" name="dow">
                                <option value="${dow}" selected>${dow2Text(dow)}</option>
                                ${allRepeaters.map((d, i) => i == dow ? '' : `<option value="${i}">${d}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-10">
                            <div class="col-auto input-group mb-3">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="basic-addon2">http://</span>
                                </div>
                                <input type="text" value="${source_url}" onchange="window.previewWebsite($(this).parent().parent().parent().parent().parent().index() - 1)" name="source_url" class="form-control" placeholder="URL till hemsidan" aria-label="URL till hemsidan" aria-describedby="basic-addon2">
                            </div>
                        </div>
                    </div>
                    <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                            <div class="input-group mb-3">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="basic-addon2" onclick="window.findElementSession(this.parentNode.parentNode.querySelector('input'));" style="cursor: pointer"><i class="fas fa-crosshairs"></i></span>
                                    <span class="input-group-text" id="basic-addon3">Selectering:</span>
                                </div>
                                <input type="text" value="${html2text(extractor)}" name="extractor" class="form-control" placeholder="Selecterare" aria-label="Selecterare" aria-describedby="basic-addon3">
                            </div>
                            <div class="input-info"></div>
                        </div>
                    </div>
                </div>
            </li>
        `)
    }
    function previewRestaurant(el, records, toggle) {
        const container = $('#restaurantinfo');
        container.html(`
        <div class="mt-4 text-center small">
        Klicka på en restaurang ovan
        </div>
        `);
        let card = $(el);
        if (el === null) {
            const cards = $('.restaurant-card').parent();
            const existingIds = cards.toArray().map(e => parseInt(e.id.replace('restaurant', '')));
            const rcontainer = $("#restaurantcontainer");
            const id = Math.max(-1, ...existingIds) + 1;
            restaurants[id] = records;
            card = restaurantTemplate(id, 0);
            card.prependTo(rcontainer);
        }
        if (!card.hasClass('bg-primary')) {
            $('.bg-primary').removeClass('bg-primary');
            card.addClass('bg-primary');
        } else {
            card.removeClass('bg-primary');
            return
        }
        container.text('');
        const id = card.attr('data-id');
        const list = $(`<ul id="restaurantdetails" data-id="${id}" class="row list-group"></ul>`);
        list.appendTo(container);
        $(`  
            <li class="row no-gutters list-group-item align-items-center">
                <div class="input-group mr-1 mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="basic-addon1">Namn:</span>
                    </div>
                    <input type="text" value="${html2text(records[0].restaurant)}" onkeyup="$('#restaurant${id} .restaurant-name').text(this.value)" name="restaurant" class="form-control" placeholder="Namn på restaurangen" aria-label="Namn på restaurangen" aria-describedby="basic-addon1">
                </div>
            </li>
        `).appendTo(list)
        records.forEach(record => {
            menuDOWTemplate(record).appendTo(list)
        });
        const addBtn = $('<div style="margin-top: -20px; position: relative; z-index: 1" class="row btn btn-primary" tabindex="-1" role="button" aria-disabled="true"><i class="fas fa-plus"></i></div>')
        addBtn.on('click', () => {
            const record = {
                source_url: records.length > 0 ? records[records.length - 1].source_url : '',
                restaurant: records.length > 0 ? records[records.length - 1].restaurant : '',
                dow: records.length > 0 ? (records[records.length - 1].dow + 1) % allRepeaters.length : 0,
            };
            menuDOWTemplate(record).appendTo(list)
        })
        const saveBtn = $('<button class="row btn-block btn btn-primary" tabindex="-1" role="button" aria-disabled="true">Spara <i class="fas fa-save"></i></input>')
        saveBtn.on('click', window.submitRestaurant)
        addBtn.appendTo(container)
        $('<div class="dropdown-divider"></div>').appendTo(container)
        saveBtn.appendTo(container)
        previewWebsite();
    }

    const previewWebsite = window.previewWebsite = (i) => {
        const ith = i || 0;
        const webpreview = $('#webpreview');
        const id = $('#restaurantdetails').attr('data-id');
        const sourceUrl = $('input[name="source_url"]')[ith].value || restaurants[id][ith].source_url;
        const url = `/api/scrape/external/render/index.html?url=${sourceUrl}`;
        const iframe = $('iframe');
        if (iframe.length === 0 || iframe.attr('src') !== url) {
            webpreview.text('');
            $(`
                <iframe 
                    title="restaurant page"
                    sanbox
                    style="height: calc(20rem - 43px)!important;width: 100%;position: relative; z-index: 100;"
                    src="${url}">
                        Iframe is not supported
                </iframe>
            `).appendTo(webpreview);
        }
    };
    
    function getPath(elem) {
        if (elem.id)
            return "#" + elem.id;
        if (elem.tagName == "BODY")
            return 'BODY';
        let path = getPath(elem.parentNode);
        let subpath = elem.tagName;
        let els = Array.from(elem.parentNode.children).filter(c => c.tagName === elem.tagName);
        if (elem.className) {
            els = els.filter(c => Math.max(Array.from(c.classList).map(cl => !elem.classList.contains(cl))) == 0)
            subpath = "> " + elem.tagName + "." + elem.className.replace(/ /g, '.');
        }
        path = path + ' ' + subpath;
        if (els.length > 1) {
            const nth = els.indexOf(elem);
            path = path + ':nth-child(' + (nth + 1) + ')';
        }
        return path;
    }

    const findElementSession = window.findElementSession = (selectorInputEl) => {
        const overlay = $('<div style="cursor: crosshair;position: absolute;top: 0; left: 0; width: 100vw; height: 100vh;">sd</div>');
        overlay.appendTo($('body'));
        const selectorEl = $(selectorInputEl).parent().parent().parent().parent().parent();
        const ith = selectorEl.index() - 1;
        previewWebsite(ith);
        overlay.on('click', () => overlay.remove());
        waitUntilIframeContentAvailable(() => {
            const allElementsInIframe = $($('iframe').contents().find('*').contents().toArray().filter(t => t.getRootNode().body.contains(t) && t.nodeType == 3 && !!t.nodeValue.trim()).map(t => {
                const wrapperEl = $('<span class="kv22"></span>');
                let prevWrapperEl = null;
                t.nodeValue.split('\n').forEach((textPart, i) => {
                    const partEl = wrapperEl.clone().text(t.nodeValue)[0];
                    if (i == 0) {
                        t.parentNode.replaceChild(wrapperEl, t);
                        prevWrapperEl = partEl;
                    } else {
                        partEl.insertAfter(prevWrapperEl);
                    }
                });
                return wrapperEl;
            }));
            var style = $(`
            <style>
                .kv22-highlight { background-color: yellow !important; }
                * {cursor: crosshair !important;}
            </style>
            `);
            style.appendTo($('iframe').contents().find('head'));
            //allElementsInIframe.css('cursor', 'crosshair');
            const mouseover = (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                ev.target.classList.add('kv22-highlight');
                return false;
            };
            const mouseout = (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                ev.target.classList.remove('kv22-highlight');
                return false;
            };
            let startElement = null;
            const mousedown = function (ev) {
                startElement = ev.target;
            };
            const mouseup = function (ev) {
                ev.stopPropagation();
                ev.preventDefault();
                let extractor = getPath(ev.target).replace(/\.kv22-highlight/g, '');
                let value = ev.target.innerHTML;
                if (startElement !== ev.target) {
                    value = startElement.innerHTML + value;
                    extractor = getPath(startElement).replace(/\.kv22-highlight/g, '') + '\n' + extractor;
                }
                selectorInputEl.value = extractor;
                $(selectorInputEl).parent().parent().find('.input-info').text(value);
                
                // reset all elements in page
                overlay.remove();
                style.remove();
                allElementsInIframe.each(el => {
                    el.parentNode.replaceChild($(el).contents()[0], el);
                });
                allElementsInIframe.off('mouseout', mouseout);
                allElementsInIframe.off('mouseover', mouseover);
                allElementsInIframe.off('click', mouseup);
                previewWebsite(ith);
                return false;
            };
            allElementsInIframe.on('mouseover', mouseover);
            allElementsInIframe.on('mouseout', mouseout);
            allElementsInIframe.on('mousedown', mousedown);
            allElementsInIframe.on('mouseup', mouseup);
        });
    }
    function waitUntilIframeContentAvailable(cb) {
        if ($('iframe').contents()[0].readyState === 'complete' && $('iframe').contents().find('body').children().length > 0) {
            return cb();
        }
        setTimeout(() => waitUntilIframeContentAvailable(cb), 300);
    }

    function setupRestaurants() {
        const container = $("#restaurantcontainer");
        container.text("")
        $(`
            <div class="col-xl-8 col-lg-7">
                <div class="mb-4">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
        `).appendTo(container);
        const setupPromise = $.get('/api/restaurants/menu').then((data) => {
            const restIds = data
                .map(p => p.restaurant);
            restaurants = data.reduce((p, c) => {
                const id = restIds.indexOf(c.restaurant)
                return {
                    ...p,
                    [id]: [c, ...(p[id] || [])]
                }
            }, {});
            container.text("");
            Object.keys(restaurants).forEach((_, id) => {
                const today = new Date().getDay() + 1;
                const i = restaurants[id].findIndex(r => r.dow === 0 || r.dow === today);
                const template = restaurantTemplate(id, i);
                template.appendTo(container);
            })
            const addBtn = $('<div style="margin: -20px -34px 0 0;" class="col-auto"><div class="btn btn-lg btn-primary" tabindex="-1" role="button" aria-disabled="true"><i class="fas fa-plus"></i></div>')
            addBtn.on('click', () => {
                previewRestaurant(null, [{
                    restaurant: 'Ny restaurang',
                    dow: 0,
                    extractor: '',
                    source_url: ''
                }], true)
            });
            addBtn.appendTo(container);
        })

        window.submitRestaurant = (form) => {
            form && form.preventDefault();
            form && form.stopPropagation();
            const formArray = $('#restaurantinfo').serializeArray();
            const restaurant = formArray.shift().value;
            const selectors = $('.restaurant-selector');
            const data = {
                restaurant
            };
            let deleteCount = 0;
            let promises = [];
            for (var i = 0; i < selectors.length; i++) {
                const attrsCount = formArray.length / selectors.length;
                const selFormAttrs = formArray.slice(i * attrsCount, (i + 1) * attrsCount);
                const attrs = selFormAttrs.reduce((p, c) => {
                    return {
                        ...p,
                        [c.name]: c.value
                    }
                }, {});
                if (selectors[i].classList.contains('remove-restaurant')) {
                    deleteCount += 1;
                    promises.push($.ajax({
                        url: '/api/scrape/external',
                        type: "DELETE",
                        dataType: "json",
                        contentType: "application/json",
                        data: JSON.stringify({ ...attrs, ...data })
                    }));
                } else {
                    promises.push($.ajax({
                        url: '/api/scrape/external',
                        type: "POST",
                        dataType: "json",
                        contentType: "application/json",
                        data: JSON.stringify({ ...attrs, ...data })
                    }));
                }
            }
            Promise.all(promises).then(setupRestaurants).then(() => {
                const id = $('#restaurantdetails').attr('data-id');
                if (deleteCount == selectors.length) {
                    previewRestaurant($('#restaurant' + id)[0], restaurants[id]);
                    $('restaurant' + id).remove();
                } else {
                    previewRestaurant($('#restaurant' + id)[0], restaurants[id], false);
                }
            });
            return false;
        };
        return setupPromise;
    }
    setupRestaurants();
})()
