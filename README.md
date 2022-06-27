# Lunch Summarizer

Hi guys, this is yet another lunch menu-collector. I'm located in Sundsvall approximately in the middle of Sweden and thus I will maintain the restaurants around these areas further location-contributions are appriciated although you'll have to maintain themselves otherwise they will be removed eventually. As so many other services that exists out there that also shows restaurant-menu information, why do we create another one? Well, short answer, it is fun to develop something that you have use for in your daily, work and lunch we all need! The slightly longer answer is that there are some features missing from existing services, commonly, lacking the possibility to dynamically add additional restaurants, automatically configure what portion of the website resembles the menu items. With that said there are plenty of good services like this out there, here is a list of the ones I've got my inspiration from:

* https://github.com/sa3mlk/lunchsvall
* https://lunchguide.nu/
* https://www.restaurangkartan.se/

## Contibuting
I'm happy for any kind of input to this product to make it better, there are already many features planned, see the [Issues](https://github.com/jolin1337/lunch-summarizer/issues) tab at Github. There are three main areas where you can contibute. Feature suggestions, Adding and fixing broken restaurant info and code improvements.

### Suggest a new feature
If you have a new feature that you think should be in the product, please explain the feature in detail in a issue, where in the app it should be located and how the interaction should happen. Tag the issue with feature so that it is easily found among bug reports and other todo tickets.

### Adding or fixing broken restaurant info
Together it is my hope that this service are maintained in a comunity that mutually wants it to work and use it to find where to eat food in close proximity and therefore if a restaurant is missing or some menues are incorrect information we either fix it as soon as we discover (e.g. we go for lunch) or we submit a bug-report in the issues tab.

### Code improvements

#### Dependencies
All you need is docker installed! or you can have python installed together with pip and install the dependencies manually from requirements.txt

#### Local Dev environment
```
$ python -m venv venv
$ source venv/bin/activate
$ python -m pip install -r requirements.txt
$ ./install-chrome.sh
$ ./uvicorn.sh --reload
```
