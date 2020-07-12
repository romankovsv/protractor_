import {BData} from "./BData";

export class BDataBuilder {

    data:BData;

    constructor(data:string){
        this.data = new BData(data);
    }

    public setIban(iban:string){
        this.data.iban = iban;
        return this;
    }

    public setBic(bic:string){
        this.data.bic = bic;
        return this;
    }

    public setAccountHolder(holder:string){
        this.data.accountHolder = holder;
        return this;
    }

    public build():BData{
        return this.data;
    }
}
