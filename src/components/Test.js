import React, { Component } from 'react'
import Web3 from 'web3'
import web3utils from 'web3-utils'
import siteConfig from "../config/SiteConfig.json";
import { ReactComponent as CloseIcon } from "../assets/images/ic__close.svg"

//using the abi of the loan token logic for the loan token contract because loan token contract use the delegate call on the loan token logic
import abiLoanToken from "../config/abiLoanToken.js";
import abiTestToken from "../config/abiTestToken.js";
import abiLoanOpeningEvents from "../config/abiLoanopeningEvents.js";
import { testTokenSUSD, testTokenRBTC, loanTokenSUSD, loanTokenRBTC } from "../config/addresses.js"
const abiDecoder = require('abi-decoder');


//Empty comment

class Test extends Component {
  constructor(props) {
    super(props)
    this._isMounted = false
    this.state = {
      account: "",
      modalOpen: false
    }
    this.openLongPosition = this.openLongPosition.bind(this);
    this.openShortPosition = this.openShortPosition.bind(this);
    abiDecoder.addABI(abiLoanOpeningEvents);
  }

  componentDidMount() {
    this._isMounted = true
    this.loadBlockchainData()
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  //init web3 and contracts
  async loadBlockchainData() {
    console.log("init web3");
    let web3;
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      window.ethereum.enable();
    }
    else web3 = new Web3(Web3.givenProvider);
    this.contractISUSD = new web3.eth.Contract(abiLoanToken, loanTokenSUSD);
    this.contractIRBTC = new web3.eth.Contract(abiLoanToken, loanTokenRBTC);
    this.contractTokenSUSD = new web3.eth.Contract(abiTestToken, testTokenSUSD);
    this.contractTokenRBTC = new web3.eth.Contract(abiTestToken, testTokenRBTC);
    const accounts = await web3.eth.getAccounts();
    this.web3 = web3;
    this._isMounted && this.setState({ account: accounts[0] });
  }


  /**
   * Open a long position on ISUSD loan token contract
   */
  async openLongPosition() {
    this._isMounted && this.setState({ loading: true })

    const leverage = this.props.leverage.toString();
    console.log("send long tx with " + leverage + " leverage" + " deposit amount " + this.props.depositValue.toString());
    const loanId = "0x0000000000000000000000000000000000000000000000000000000000000000"; // 0 if new loan
    const leverageAmount = web3utils.toWei(leverage, 'ether');
    const loanTokenSent = 0;
    const borrowAmount = 0; //needed for MVP
    const initialMargin = 0; //needed for MVP
    //passs a vale from the user from 0-5
    const collateralTokenSent = web3utils.toWei(this.props.depositValue.toString(), 'ether'); //= 10000 $
    const trader = this.state.account; //This is the user's account
    const loanDataBytes = "0x"; //need to be empty

    console.log("Trader: " + trader);

    //PENDING
    this.props.transactionComplete("pending", "")


    await this.approveToken("contractTokenRBTC", loanTokenSUSD, collateralTokenSent);

    this.marginTrade("contractISUSD", loanId, leverageAmount, loanTokenSent, collateralTokenSent, testTokenRBTC, trader, loanDataBytes);

  }


  /**
   * Open a short position on IRBTC loan token contract
   */
  async openShortPosition() {
    this._isMounted && this.setState({ loading: true })

    const leverage = this.props.leverage.toString();
    console.log("send short tx with " + leverage + " leverage");
    const loanId = "0x0000000000000000000000000000000000000000000000000000000000000000"; // 0 if new loan
    const leverageAmount = web3utils.toWei(leverage, 'ether');
    const loanTokenSent = 0;
    const borrowAmount = 0; //needed for MVP
    const initialMargin = 0; //needed for MVP

    const collateralTokenSent = web3utils.toWei(this.props.depositValue.toString(), 'ether');
    const trader = this.state.account; //This is the user's account
    const loanDataBytes = "0x"; //need to be empty
    console.log("Trader: " + trader);

    //PENDING
    this.props.transactionComplete("pending", "")


    await this.approveToken("contractTokenSUSD", loanTokenRBTC, collateralTokenSent);

    this.marginTrade("contractIRBTC", loanId, leverageAmount, loanTokenSent, collateralTokenSent, testTokenSUSD, trader, loanDataBytes);

  }


  /**
   * Tokenholder approves the loan token contract to spend tokens on his behalf
   */
  approveToken(tokenAdr, loanToken, collateralToken) {
    return new Promise(resolve => {

      this[tokenAdr].methods.approve(loanToken, collateralToken)
        .send({ from: this.state.account })
        .then((tx) => {
          console.log("Approved Transaction: ", tx)
          this.props.transactionComplete("approved")
          //this._isMounted && this.setState({ loading: false, transactionCompleted: tx.status });
          // .catch((err) => {
          //   console.warn("Error: " + err)
          //   this.props.transactionComplete("error", err)
          // })
          resolve();
        });
    });
  }

  /**
   * Executes a margin trade
   * in case of ISUSD the collateral is RBTC, in case of RBTC collateral is IUSD
   */
  async marginTrade(contractToken, loanId, leverageAmount, loanTokenSent, collateralTokenSent, testTokenAdr, trader, loanDataBytes) {
    //collateral can be in SUSD or RBTC
    //it needs to be passed in the margin trade function either as loanTokenSent or collateralTokenSent depending on the iToken
    this[contractToken].methods.marginTrade(
        loanId,
        leverageAmount,
        loanTokenSent,
        collateralTokenSent,
        testTokenAdr, //in case of ISUSD the collateral is RBTC 
        trader,
        loanDataBytes
      )
      .send({ from: this.state.account })
      .then(async (tx) => {
        console.log("marginTrade Transaction: ", tx);

        let result = [0,0];
        if (tx.transactionHash) result = await this.parseLog(tx.transactionHash);
        tx.positionSize=result[0];
        tx.entryPrice=result[1];
        
        this._isMounted && this.setState({ loading: false, transactionCompleted: tx.status});
        //Passes the transaction result to the parent component
        this.props.transactionComplete("success", tx)
      })
    .catch((err) => {
      console.warn("Error: " + err)
      this.props.transactionComplete("error")
    })
  }

  /**
   * parse the marginTrade event log
   * events[5] = position size
   * events[9] = entry price
   */
  parseLog(txHash, abi) {
    console.log("parsing log");
    return new Promise(resolve => {
      this.web3.eth.getTransactionReceipt(txHash, function(e, receipt) {
        const decodedLogs = abiDecoder.decodeLogs(receipt.logs);
        console.log(decodedLogs);
        
        for(let i=0;i<decodedLogs.length;i++) {
          if(decodedLogs[i] && decodedLogs[i].events) {
            if(decodedLogs[i].events[5]!=null && decodedLogs[i].events[9]!=null) {
            const posP = parseFloat(web3utils.fromWei(decodedLogs[i].events[5].value, 'ether')).toFixed(4);
            const entryP = parseFloat(web3utils.fromWei(decodedLogs[i].events[9].value, 'ether')).toFixed(4);
            return resolve([posP, entryP]);
            }
          }
        }
        resolve([0,0]);
      });
    });
  }
  
  


  /**
   * Needed for MVP
   * calculates required collateral calling collateral token contract
   * Using rbtc as collateral for long positions and susd as collateral for short position. Need to be made generic for Mvp
   * Margin need to be replaced
   */
  getRequiredCollateral(collateralTokenContract, adrLoanToken, adrCollateralToken, borrowAmount) {
    return new Promise(resolve => {
      //address loanToken, address collateralToken, uint256 newPrincipal,uint256 marginAmount, bool isTorqueLoan 
      this[collateralTokenContract].methods.getRequiredCollateral(adrLoanToken, adrCollateralToken, borrowAmount, 50e18, false).call({ from: this.state.account }).then((res) => {
        console.log("amount: ");
        console.log(res);
        resolve(res);
      });
    });
  }


  render() {

    return (
      <React.Fragment>


          <button 
            className="trade-token-grid-row__buy-button trade-token-grid-row__button--size-half" 
            disabled={this.props.depositValue < this.props.minValue || this.props.depositValue > this.props.maxValue}
            //{siteConfig.TradeBuyDisabled} 
            onClick={this.props.position === "LONG" && this.openLongPosition || this.openShortPosition}
          >
            BUY
          </button>
 
      </React.Fragment>
    );
  }
}

export default Test;