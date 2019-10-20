import { browser, element,by, $$, $, WebElement, protractor } from "protractor";
import {authorize, listMessages} from "../../src/email";
const fs = require('fs');
const readline = require('readline');


describe("Suite",  async function(){


    it("First Test on protractor",   async function(){
         console.log("Test is started");

        fs.readFile('credentials.json', (err, content) => {
            console.log("Method readFile has been called")
            if (err) return console.log('Error loading client secret file:', err);
            authorize(JSON.parse(content), listMessages);
        });

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
