function getPath(elem) {
    if (elem.id)
        return "#" + elem.id;
    if (elem.tagName == "BODY")
        return '';
    var path = getPath(elem.parentNode);
    if (elem.className)
        return path + " " + elem.tagName + "." + elem.className;
    return path + " " + elem.tagName;
}