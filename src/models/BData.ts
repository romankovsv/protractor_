import {WebElement} from "../wrappers/WebElement";

export class BData {

    bank:string;
    iban:string;
    bic:string
    accountHolder:string;

    constructor(bank:string){
        this.bank = bank;
    }



}
