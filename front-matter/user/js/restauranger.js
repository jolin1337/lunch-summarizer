(function () {
    function html2text(html) {
        return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function html2url(html) {
        if (html.startsWith('http')) return encodeURI(html);
        return 'https://' + encodeURI(html);
    }
    $.get('/api/restaurants/menu').then((data) => {
        console.log(data)
        const uptodate = $('#uptodate h6');
        const staticmenu = $('#staticmenu h6');
        const weekmenu = $('#weekmenu h6');
        const allmenu = $('#allmenu h6');
        const restaurants = data.reduce((p, c) => {
            return {
                ...p,
                [c.restaurant]: [c, ...(p[c.restaurant] || [])]
            }
        }, {})
        Object.values(restaurants).forEach(records => {
            const today = new Date().getDay() + 1
            records.forEach(record => {
                const { dow, restaurant, food_description, source_url, last_updated } = record;
                if (!food_description || !restaurant || !source_url) return;
                const item = $(`
                <a href="${html2url(source_url)}" class="media text-muted pt-3">
                    <img alt="" src="${html2url(source_url)}/favicon.ico" style="max-height: 40px;max-width: 40px;"
                        class="mr-2 rounded">
                    <p class="media-body pb-3 mb-0 small lh-125 border-bottom border-gray">
                        <strong class="d-block text-gray-dark">${html2text(restaurant)}</strong>
                        ${html2text(food_description)}
                    </p>
                </a>
                `);
                if (dow == 0) item.clone().insertAfter(staticmenu);
                if (dow > 0 && r.dow === today) item.clone().insertAfter(weekmenu);
                if ((dow == 0 || dow > 0 && r.dow === today) && new Date() - new Date(last_updated) / (24 * 60 * 60 * 1000) < 1) item.clone().insertAfter(weekmenu);
                item.clone().insertAfter(allmenu);
            });
        })
    })
})()