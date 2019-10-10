import { browser, element,by, $$, $, WebElement, protractor } from "protractor";


describe("Suite",  async ()=>{

    it("First Test on protractor",   async ()=>{
         console.log("Test is started");
        var EC = protractor.ExpectedConditions;
        var button = $('#xyz');
        var isClickable = EC.elementToBeClickable(button);

     await browser.get("http://todomvc.com/examples/angular2/");
       var b = await $(".new-todo");
        var clickable = await EC.elementToBeClickable(b);
        await browser.wait(clickable,5000);



        await b.sendKeys("My note is here");
        await browser.actions().sendKeys(protractor.Key.ENTER).perform();

       await browser.wait(isClickable, 5000);
        /* element(by.css(".js-app-search-suggest .search-form__submit")).getText().then(function (text) {
            console.log(text);
        })
         element.all(by.cssContainingText('.menu-categories__link',"Ноутбуки и компьютеры")).each(function(element, index) {
             element.getText().then(function(text) {
                 console.log(text);
             });
         });*/
    });


   /* $$('.items li').filter(function(elem, index) {
            return elem.getText().then(function(text) {
                return text === 'Third';
            });
        }).first().click();

        await <WebElement> $$("a.menu-categories__link");
    /!*    .filter(function (element) {
            return element.getAttribute("href").then(function (text) {
                return text+"".includes("computers-notebooks");
            });
        }).first().click();*!/

        $(".menu-toggler__text").click();
        headings.getText().then((text)=>{
            console.log("Heading: " + text + "\\n");
        })
        expect(true).toEqual(false);
*/


});
