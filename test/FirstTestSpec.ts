import "mocha";
import { browser, element,by, $$, $ } from "protractor";


describe("Suite", ()=>{
    it("First Test on protractor", async ()=>{
        await browser.get("https://rozetka.com.ua");

        let headings = $(".well.hoverwell.thumbnail > h2");


        headings.getText().then((text)=>{
            console.log("Heading: " + text + "\\n");
        })
        expect(true).toEqual(false);


    } );
});
