import { browser, element,by, $$, $, WebElement, protractor } from "protractor";


describe("Suite",  async ()=>{

    it("First Test on protractor",   async ()=>{
         console.log("Test is started");
        let EC = protractor.ExpectedConditions;
        let button = $('#xyz');
        let isClickable = EC.elementToBeClickable(button);

     await browser.get("http://todomvc.com/examples/angular2/");
        let b = await $(".new-todo");
        let clickable = await EC.elementToBeClickable(b);
        await browser.wait(clickable,5000);
        await b.sendKeys("My note is here");
    });

});
