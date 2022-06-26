import traceback
from datetime import datetime
import json

from bs4 import BeautifulSoup
from bs4.element import Comment
import requests
from sqlalchemy import and_
from selenium.webdriver.common.by import By

import chromebrowser
from config import engine, tables

        
def soup_crawler(source_url, menu):
    soup = BeautifulSoup(requests.get(source_url).text, 'lxml')
    
    for child in soup.recursiveChildGenerator():
        if not child.name and child.strip() != '' and child.parent.name not in ['script', 'link', 'style', 'meta', 'head', 'html'] and not isinstance(child, Comment):
            # print("AAAA", type(child), child, ":::", child.parent.name)
            
            content = f'<span class="kv22">{child.strip()}</span>'
            temp = BeautifulSoup(content, 'lxml')
            nodes_to_insert = temp.find('body').children
            for i, node in enumerate(nodes_to_insert):
                child.parent.insert(i, node)
    return soup.select_one(menu['extractor']).text

def selenium_crawler(source_url, menu, driver=None):
    if driver is None:
        driver = chromebrowser.load_web_driver()
    try:
        print("Crawling website:", source_url)
        driver.get(source_url)
        with open('front-matter/vendor/jquery/jquery.min.js', 'r') as jquery_js:
            driver.execute_script(jquery_js.read() + """
                try {
                    const allElementsInIframe = $($('*').contents().toArray().filter(t => t.getRootNode().body.contains(t) && t.nodeType == 3 && !!t.nodeValue.trim()).map(t => {
                        const wrapperEl = $('<span class="kv22"></span>');
                        let prevWrapperEl = null;
                        return t.nodeValue.split('\\n').map((textPart, i) => {
                            const partEl = wrapperEl.clone().text(textPart);
                            if (i == 0) {
                                t.parentNode.replaceChild(partEl[0], t);
                                prevWrapperEl = partEl;
                            } else {
                                partEl.insertAfter(prevWrapperEl);
                            }
                            return partEl[0];
                        });
                    }).reduce((p, c) => [...p, ...c], []));
                } catch(e) {
                    console.error(e);
                    throw e;
                }
            """)
        if (menu['extractor'].startswith('[') and menu['extractor'].endswith(']')) or (menu['extractor'].startswith('{') and menu['extractor'].endswith('}')):
            instructions = json.loads(menu['extractor'])
            print("Instructions:", instructions)
        else:
            print("Find element:" + menu['extractor'])
            return driver.find_element(by=By.CSS_SELECTOR, value=menu['extractor']).text
    except:
        print("error!")
        print(traceback.format_exc())

def crawl_website(source_url, menu, connection=None, transaction=None, driver=None):
    now = datetime.now()
    data = None
    try:
        data = soup_crawler(source_url, menu)
    except:
        print("error!")
        print(traceback.format_exc())
    if data is None or data == '':
        try:
            data = selenium_crawler(source_url, menu, driver)
        except:
            print("error!")
            print(traceback.format_exc())
    print("Description:", data)
    menu['food_description'] = data
    menu['last_updated'] = now.isoformat()
    table = tables['Menu']
    try:
        if connection is None:
            connection = engine.connect()
            transaction = connection.begin()
        connection.execute(table.update().where(
            and_(
                table.c.dow == menu['dow'],
                table.c.restaurant == menu['restaurant']
            )
        ).values(
            last_updated=menu['last_updated'],
            food_description=menu['food_description']
        ))
    except:
        print("error!")
        print(traceback.format_exc())
        connection.close()
        transaction.close()
        connection = None
        transaction = None
    return connection, transaction
