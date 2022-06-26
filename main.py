import os
import json
from datetime import datetime
import traceback
from fastapi import FastAPI, Response, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import requests
import pandas as pd
from sqlalchemy import inspect, Column, MetaData, engine_from_config, Table, and_, create_engine
from sqlalchemy import types as db_types
import yaml
from api.schema.menu import Menu
import chromebrowser
from selenium.webdriver.common.by import By
from config import get_menu_from_db, tables, engine
from crawler import crawl_website



app = FastAPI()
app.mount("/user", StaticFiles(directory="front-matter/user"), name="static-user")
app.mount("/admin", StaticFiles(directory="front-matter/admin"),
          name="static-admin")
app.mount("/vendor", StaticFiles(directory="front-matter/vendor"),
          name="static-vendor")

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
            if 'http' in base_url:
                base_url = '//'.join(base_url.split('//')[1:])
            # base_url.count('/') > 2 and '.' in os.path.basename(base_url.split('://')[1]):
            if not base_url.endswith('/') and '/' in base_url:
                base_url = os.path.dirname(base_url)
            response.headers['Set-Cookie'] = 'base_url=' + base_url
        response.headers['Content-Type'] = media_type
    except requests.exceptions.SSLError:
        response = Response(status_code=495)
    except requests.exceptions.ConnectionError:
        print("Connection error!")
        response = Response(status_code=404)
    return response

@app.get("/")
@app.get("/user")
@app.get("/user/")
def root():
    return RedirectResponse("/user/index.html")


@app.get("/admin")
@app.get("/admin/")
def root():
    return RedirectResponse("/admin/index.html")


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
        sub_url = 'https://' + sub_url
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
def get_restaurant_menues(force_update: bool = False):
    menues = []
    with engine.connect() as connection:
        data = get_menu_from_db(connection)
        menues = list(data.to_dict(orient='index').values())
    driver = chromebrowser.load_web_driver()
    connection = None
    transaction = None
    for menu in menues:
        now = datetime.now()
        if force_update or pd.isna(menu['last_updated']) or pd.isnull(menu['last_updated']) or (now - menu['last_updated']).days > 1:
            source_url = menu['source_url']
            if not source_url.startswith('http'):
                source_url = 'https://' + source_url
            connection, transaction = crawl_website(source_url, menu, 
                driver=driver, 
                connection=connection, 
                transaction=transaction)
    if connection is not None:
        transaction.commit()
        # data = get_menu_from_db(connection)
        connection.close()
    return menues
