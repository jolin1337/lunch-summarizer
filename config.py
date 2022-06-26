import os
import yaml
from sqlalchemy import inspect, Column, MetaData, engine_from_config, Table, create_engine
from sqlalchemy import types as db_types

import pandas as pd
from api.schema.menu import Menu


def get_menu_from_db(connection):
    d = pd.read_sql_table('Menu', connection, parse_dates=['last_updated'])
    print(d)
    return d

db_types = db_types.__dict__

try:
    os.makedirs('data', exist_ok=True)
    config = yaml.safe_load(
        open('config/' + os.environ.get('ENV', 'development') + '.yaml', 'r'))
    engine = engine_from_config(config, prefix='')
except:
    engine = create_engine(os.environ.get('DB_URI'))
    print("DB Loaded:", os.environ.get('DB_URI'))
schemas_json = [Menu.schema()]
tables = {}
with engine.connect() as connection:
    dbmeta = MetaData()
    for schema in schemas_json:
        columns = [Column(name=key, type_=db_types[prop['type'].title()], default=None)
                   for key, prop in schema['properties'].items()]
        tables[schema['title']] = Table(schema['title'], dbmeta, *columns)
        # if not inspect(engine).has_table(schema['title']):
        #    print("Creating " + schema['title'])
        #    tables[schema['title']].__table__.create(bind=engine, checkfirst=True)
    dbmeta.create_all(bind=connection, checkfirst=True)
    data = get_menu_from_db(connection)
