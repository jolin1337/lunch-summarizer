(function () {
    function html2text(html) {
        return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function html2url(html) {
        if (html.startsWith('http')) return encodeURI(html);
        return 'https://' + encodeURI(html);
    }
    function handleMenu(data) {
        const newlyupdated = $('#newlyupdated .content').text('');
        const staticmenu = $('#staticmenu .content').text('');
        const weekmenu = $('#weekmenu .content').text('');
        const allmenu = $('#allmenu .content').text('');
        const restaurants = data.reduce((p, c) => {
            return {
                ...p,
                [c.restaurant]: [c, ...(p[c.restaurant] || [])]
            }
        }, {})
        function filterTypes(record) {
            const today = new Date().getDay() || 7;
            const { dow, last_updated } = record;
            const types = [];
            if (dow == 0) types.push("static");
            if (dow > 0 && dow === today) types.push("weekly");
            if ((dow == 0 || (dow > 0 && dow === today)) && (new Date() - new Date(last_updated)) / (24 * 60 * 60 * 1000) < 1) types.push('newlyupdated');
            return types;
        }
        function restaurantTemplate({ source_url, food_description, restaurant }) {
            return $(`
                <a href="${html2url(source_url)}" class="restaurant-item media text-muted pt-3" target="blank">
                    <img alt="" src="${html2url(source_url)}/favicon.ico" style="max-height: 40px;max-width: 40px;"
                        class="mr-2 rounded">
                    <p class="media-body pb-3 mb-0 small lh-125 border-bottom border-gray">
                        <strong class="d-block text-gray-dark">${html2text(restaurant)}</strong>
                        ${html2text(food_description ? food_description : 'Kunde inte hämta informatio om maten, kolla över så att sidan inte ändrats')}
                    </p>
                </a>
            `);
        }
        Object.values(restaurants).forEach(records => {
            const staticRecords = records.filter(r => filterTypes(r).includes('static') && r.restaurant && r.source_url);
            staticRecords.forEach(record => {
                restaurantTemplate(record).clone().appendTo(staticmenu);
            })
            records.forEach(record => {
                const { restaurant, source_url } = record;
                if (!restaurant || !source_url) return;
                const item = restaurantTemplate(record);
                const types = filterTypes(record);
                if (types.includes('weekly')) item.clone().appendTo(weekmenu);
                if (types.includes('newlyupdated')) item.clone().appendTo(newlyupdated);
                item.clone().appendTo(allmenu);
            });
        });
        $('#randomFoodModal').on('show.bs.modal', function (event) {
            const button = $(event.relatedTarget) // Button that triggered the modal
            const filter = button.data('filter') || 'all';
            const modalBody = $(this).find('.modal-body').text('');
            const r = Object.values(restaurants).reduce((p, c) => {
                const cf = c.filter(m => filterTypes(m).includes(filter));
                return [...p, ...cf];
            }, []);
            if (r.length > 0) {
                console.log(r, r.map(c => c.filter(m => filterTypes(m).includes(filter))));
                const restaurantIdx = Math.floor(Math.random() * r.length);
                modalBody.append(restaurantTemplate(r[restaurantIdx]));
            }
        });
        $('#listFoodModal').on('show.bs.modal', function (event) {
            const button = $(event.relatedTarget) // Button that triggered the modal
            const filter = button.data('filter') || 'all';
            const modalBody = $(this).find('.modal-body').text('');
            const rs = Object.values(restaurants);
            rs.forEach(r => {
                r.forEach(m => {
                    if (filter === 'all' || filterTypes(m).includes(filter)) {
                        modalBody.append(restaurantTemplate(m));
                    }
                });
            });
        });
        $('#search').on('keyup', function () {
            $('.restaurant-item').toArray().forEach(el => {
                console.log(typeof el.innerText, this.value)
                if (this.value === '' || el.innerText.toString().indexOf(this.value) >= 0) $(el).show();
                else $(el).hide();
            })
        })
    }
    $.get('/api/restaurants/menu').then(handleMenu).catch(() => handleMenu([
        { restaurant: ':/', dow: 0, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#', last_updated: new Date().toString() },
        { restaurant: ':/', dow: 1, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
        { restaurant: ':/', dow: 2, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
        { restaurant: ':/', dow: 3, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
        { restaurant: ':/', dow: 4, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
        { restaurant: ':/', dow: 5, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
        { restaurant: ':/', dow: 6, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
        { restaurant: ':/', dow: 7, food_description: 'Något kan vara fel, vi saknar menyer :/', source_url: '#' },
    ]))
    const food = ["fa-hamburger", "fa-fish", "fa-bacon", "fa-coffee", "fa-egg", 'fa-pizza-slice', 'fa-pepper-hot', 'fa-bread-slice', 'fa-cocktail', 'fa-mug-hot'];
    function updateFoodIcons(posfix) {
        $(".random-food" + (posfix || '')).toArray().forEach((el) => {
            const randomfood = food[Math.floor(Math.random() * food.length)];
            ($(el).find('i.fas')[0] || {}).className = `fas ${randomfood} random-food fa-fw fa-lg text-white mr-2 rounded`
        })
    }
    updateFoodIcons();
    setInterval(() => updateFoodIcons(':hover'), 200)
})()
