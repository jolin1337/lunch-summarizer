import os
from datetime import datetime
import traceback
from fastapi import FastAPI, Response, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
import requests
import pandas as pd
from sqlalchemy import inspect, Column, MetaData, engine_from_config, Table, and_, create_engine
from sqlalchemy import types as db_types
import yaml
from api.schema.menu import Menu
import chromebrowser
from selenium.webdriver.common.by import By


def get_menu_from_db(connection):
    d = pd.read_sql_table('menu', connection, parse_dates=['last_updated'])
    print(d)
    return d


app = FastAPI()
app.mount("/user", StaticFiles(directory="front-matter/user"), name="static-user")
app.mount("/admin", StaticFiles(directory="front-matter/admin"),
          name="static-admin")
app.mount("/vendor", StaticFiles(directory="front-matter/vendor"),
          name="static-vendor")
db_types = db_types.__dict__

try:
    os.makedirs('data', exist_ok=True)
    config = yaml.safe_load(
        open('config/' + os.environ.get('ENV', 'development') + '.yaml', 'r'))
    engine = engine_from_config(config, prefix='')
except:
    engine = create_engine(os.environ.get('DB_URI'))
schemas_json = [Menu.schema()]
tables = {}
with engine.connect() as connection:
    dbmeta = MetaData()
    for schema in schemas_json:
        columns = [Column(name=key, type_=db_types[prop['type'].title()], default=None)
                   for key, prop in schema['properties'].items()]
        tables[schema['title']] = Table(schema['title'], dbmeta, *columns)
        #if not inspect(engine).has_table(schema['title']):
        #    print("Creating " + schema['title'])
        #    tables[schema['title']].__table__.create(bind=engine, checkfirst=True)
    dbmeta.create_all(checkFirst=True)
    data = get_menu_from_db(connection)


def do_request(url, save_base_url: bool = False):
    try:
        ext_request = requests.get(url)
        media_type = ext_request.headers.get('Content-Type', 'text/plain')
        response = Response(
            ext_request.content,
            status_code=ext_request.status_code,
            media_type=media_type
        )
        if save_base_url:
            base_url = ext_request.url
            # base_url.count('/') > 2 and '.' in os.path.basename(base_url.split('://')[1]):
            if not base_url.endswith('/'):
                base_url = os.path.dirname(base_url)
            response.headers['Set-Cookie'] = 'base_url=' + base_url
        response.headers['Content-Type'] = media_type
    except requests.exceptions.SSLError:
        response = Response(status_code=495)
    except requests.exceptions.ConnectionError:
        print("Connection error!")
        response = Response(status_code=404)
    return response


@app.get("/api/scrape/external/render/index.html")
def render_external_page(url: str):
    if not url.startswith('http'):
        url = 'https://' + url
    return do_request(url, save_base_url=True)


@app.get("/api/scrape/external/render/{url:path}")
def render_external_sub_page(url: str, request: Request):
    base_url = request.cookies.get('base_url')
    sub_url = (
        (base_url + '/' + url)
        if not url.startswith('http') and base_url is not None else url
    )
    if not sub_url.startswith('http'):
        return None
    return do_request(sub_url)


@app.post("/api/scrape/external")
def add_external_pattern(menu: Menu):
    with engine.connect() as connection:
        data = get_menu_from_db(connection)
        if data[(data.dow == menu.dow) & (data.restaurant == menu.restaurant)].shape[0] == 0:
            ex = tables['Menu'].insert().values(**menu.dict())
        else:
            ex = (
                tables['Menu']
                .update()
                .where(
                    and_(
                        tables['Menu'].c.dow == menu.dow,
                        tables['Menu'].c.restaurant == menu.restaurant
                    )
                ).values(**menu.dict())
            )
        connection.execute(ex)
        # data = get_menu_from_db(connection)


@app.delete("/api/scrape/external")
def remove_external_pattern(menu: Menu):
    with engine.connect() as connection:
        data = get_menu_from_db(connection)
        if data[(data.dow == menu.dow) & (data.restaurant == menu.restaurant)].shape[0] > 0:
            ex = (
                tables['Menu'].delete()
                .where(
                    and_(
                        tables['Menu'].c.dow == menu.dow,
                        tables['Menu'].c.restaurant == menu.restaurant
                    )
                )
            )
            print(ex)
            connection.execute(ex)
            # data = get_menu_from_db(connection)


@app.get("/api/restaurants/menu")
def get_restaurant_menues():
    menues = []
    with engine.connect() as connection:
        data = get_menu_from_db(connection)
        menues = list(data.to_dict(orient='index').values())
    driver = chromebrowser.load_web_driver()
    connection = None
    transaction = None
    for menu in menues:
        now = datetime.now()
        if pd.isna(menu['last_updated']) or pd.isnull(menu['last_updated']) or (now - menu['last_updated']).days > 1:
            source_url = menu['source_url']
            if not source_url.startswith('http'):
                source_url = 'https://' + source_url
            try:
                driver.get(source_url)
                if (menu['extractor'].startswith('[') and menu['extractor'].endswith(']')) or (menu['extractor'].startswith('{') and menu['extractor'].endswith('}')):
                    pass
                else:
                    menu['food_description'] = driver.find_element(
                        by=By.CSS_SELECTOR, value=menu['extractor']).text
            except:
                print(traceback.format_exc())
            menu['last_updated'] = now.isoformat()
            table = tables['Menu']
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
    if connection is not None:
        transaction.commit()
        # data = get_menu_from_db(connection)
        connection.close()
    return menues
