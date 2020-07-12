export class Company {

    companyName: string;
    companyLegal: string;
    taxNumber: string;
    vatNumber: string;
    gln: string;
    email: string;
    emailForOrder:string

    constructor(companyName: string) {
        this.companyName = companyName;
    }


}