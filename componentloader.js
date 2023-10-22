async function getData(component) {
    let response = await fetch(component);
    let textData = await response.text();
    return textData;
}
async function setComponent(component) {
    let element = $(component);
    $("body").prepend(element);
}
async function load(filename) {
    let component = "components/" + filename + ".html";
    let componentData = await getData(component);
    setComponent(componentData);
}
