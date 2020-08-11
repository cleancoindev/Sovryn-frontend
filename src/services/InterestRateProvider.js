import Web3 from 'web3'
import web3utils from 'web3-utils'
import abiLoanToken from "../config/abiLoanToken.js";
import {loanTokenSUSD, loanTokenRBTC } from "../config/addresses.js"


export class InterestRateProvider{
    
    constructor(){
        
      let web3;
        if (window.ethereum) {
          web3 = new Web3(window.ethereum);
          window.ethereum.enable();
        }
        else web3 = new Web3(Web3.givenProvider);
        
        this.web3 = web3;
        this.contractISUSD = new web3.eth.Contract(abiLoanToken, loanTokenSUSD);
        this.contractIRBTC = new web3.eth.Contract(abiLoanToken, loanTokenSUSD);
    }
    /**
   * Retrieves the borrow interest rate for the given token and amount.
   * @param positionType long or short. determines the iToken to borrow from
   * @param borrowAmount how much is going to be borrowed
   * */
  getBorrowInterestRate = function(positionType, borrowAmount = 0){
      let contractToken;
      if(positionType == "LONG") contractToken = this.contractISUSD;
      else contractToken = this.contractIRBTC;
      return new Promise(resolve => {
        contractToken.methods.nextBorrowInterestRate(borrowAmount).call().then((rate)=>{
        resolve(web3utils.fromWei(rate));
      });
    });
  }
  
  getLendingInterestRate = function(underlyingAsset, supplyAmount){
      let contractToken;
      if(underlyingAsset == "SUSD") contractToken =  this.contractISUSD;
      else contractToken = this.contractIRBTC;
      return new Promise(resolve => {
          contractToken.methods.nextSupplyInterestRate(supplyAmount).call().then((rate)=>{
            resolve(web3utils.fromWei(rate));
          });
      });
  }
}