import time
import os
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By


def load_web_driver() -> webdriver.Chrome:
    chrome_bin = os.environ.get("GOOGLE_CHROME_BIN")
    driver_path = os.environ.get("CHROMEDRIVER_PATH")
    # instantiate a chrome options object so you can set the size and headless preference
    chrome_options = webdriver.ChromeOptions()
    if chrome_bin is not None:
        chrome_options.binary_location = chrome_bin
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--no-sandbox")
    if driver_path is not None:
        driver = webdriver.Chrome(executable_path=driver_path, chrome_options=chrome_options)
    else:
        driver = webdriver.Chrome(chrome_options=chrome_options)

    # go to google
    driver = webdriver.Chrome(chrome_options=chrome_options)
    driver.maximize_window()
    return driver


if __name__ == '__main__':
    driver = load_web_driver()
    with open('front-matter/vendor/jquery/jquery.min.js', 'r') as jquery_js:
        print(driver.execute_script(jquery_js.read() + """
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
            return $.toString();
        """))
