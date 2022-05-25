import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By


def load_web_driver() -> webdriver.Chrome:
    # instantiate a chrome options object so you can set the size and headless preference
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920x1080")

    # go to google
    driver = webdriver.Chrome(chrome_options=chrome_options)
    driver.maximize_window()
    return driver
