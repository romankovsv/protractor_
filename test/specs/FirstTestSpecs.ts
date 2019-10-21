import {$, browser, protractor} from "protractor";
import {authorize, listMessages} from "../../src/email";

const fs = require('fs');
const readline = require('readline');


describe("Suite", async function () {
    beforeAll( function (done) {
        this.value = null
        let content = fs.readFileSync('credentials.json');
        console.log("Method readFile has been called")
        authorize(JSON.parse(content), (auth) => {
            return listMessages(auth, async (res) => {
                res.forEach((e) => {
                    e.forEach((e) => {
                        console.log("Results: " + e)
                        this.value = e;
                        console.log("In Before"+this.value)
                        done();
                    })

                })
                console.log(res[0])

            })
        });

    })


    it("First Test on protractor", async function () {
        console.log("Test is started");
        let arrayOfArray = [];

        /*    let content =  fs.readFileSync('credentials.json' );
                 console.log("Method readFile has been called")

                 authorize(JSON.parse(content), (auth) => {
                     return  listMessages(auth,  async (res) => {
                         res.forEach( (e) => {
                             e.forEach((e) => {
                                 console.log("Results: " + e)
                             })

                         })
                         console.log(res[0])

                     })
                 });*/

        console.log("In test:" + this.value)
        let EC = protractor.ExpectedConditions;
        let button = $('#xyz');
        let isClickable = EC.elementToBeClickable(button);
        await browser.get("http://todomvc.com/examples/angular2/");
        let b = await $(".new-todo");
        let clickable = await EC.elementToBeClickable(b);
        await browser.wait(clickable, 5000);
        await b.sendKeys("My note is here");


    });

});
