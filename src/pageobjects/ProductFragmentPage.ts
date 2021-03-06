import {BaseFragment} from "./BaseFragment";
import {$, browser,$$, ElementFinder} from "protractor";

export class ProductFragmentPage extends BaseFragment {

    protected actualPrice;
    protected productTitles ;


    async getPriceForItem(name: string) {
        this.productTitles = await $$("div[data-location='ProducerPage'] div[class*='title'] a");

       await console.log(this.productTitles.map((elements)=>{
           for (let i = 0; i< elements.length; i++) {
               console.log((<ElementFinder>elements[i]).getText());
           }
        }));


    }
}
