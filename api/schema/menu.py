import typing

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class Menu(BaseModel):
    restaurant: str
    source_url: str
    extractor: str
    dow: int
    food_description: Optional[str]
    last_updated: Optional[datetime]
