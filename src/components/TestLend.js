import React from "react"
import Web3 from 'web3'
import web3utils from 'web3-utils'

//using the abi of the loan token logic for the loan token contract because loan token contract use the delegate call on the loan token logic
import abiLoanToken from "../config/abiLoanToken.js";
import abiTestToken from "../config/abiTestToken.js";
import { testTokenSUSD, testTokenRBTC, loanTokenSUSD, loanTokenRBTC } from "../config/addresses.js"


class TestLend extends React.Component {
    constructor(props) {
        super(props)

        this._isMounted = false
        this.state = {
            account: "",
            loading: false,
            transactionCompleted: false,
            depositAmount: 0
        }

        this.lendRBTC = this.lendRBTC.bind(this);
        this.lendSUSD = this.lendSUSD.bind(this);
        this.handleDepositChange = this.handleDepositChange.bind(this);
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
        console.log("init web3 lending");
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
    
    
    handleDepositChange(e) {
        const { value } = e.target;
        this._isMounted && this.setState({...this.state, depositAmount: value});
    }

    /**
     *  Lend RBTC to the pool
     */
    async lendRBTC() {
        console.log("lend rbtc: "+this.state.depositAmount);
        await this.approveToken("contractTokenRBTC", loanTokenSUSD, web3utils.toWei(this.state.depositAmount.toString(), 'ether'));


        this.contractIRBTC.methods.mint(this.state.account, web3utils.toWei(this.state.depositAmount.toString(), 'ether')).send({ from: this.state.account })
            .then((tx) => {
                console.log("Mint Transaction: ", tx)
                this.props.transactionComplete("completed", tx)
            //this._isMounted && this.setState({ loading: false, transactionCompleted: tx.status });
            })
            .catch((err) => {
                console.warn("Error from lendRBTC: " + err)
                this.props.transactionComplete("error", err)
            })
        
    }
    
    
     /**
     *  Lend SUSD to the pool
     */
    async lendSUSD() {
        console.log("lend susd: "+this.state.depositAmount);
       await this.approveToken("contractTokenSUSD", loanTokenRBTC, web3utils.toWei(this.state.depositAmount.toString(), 'ether'));

        this.contractISUSD.methods.mint(this.state.account, web3utils.toWei(this.state.depositAmount.toString(), 'ether')).send({ from: this.state.account })
            .then((tx) => {
                console.log("Mint Transaction: ", tx)
                 this.props.transactionComplete("completed", tx)
                //this._isMounted && this.setState({ loading: false, transactionCompleted: tx.status });
            })
            .catch((err) => {
                console.warn("Error from lendRBTC: " + err)
                this.props.transactionComplete("error", err)
            })
    }
    
    /**
   * Tokenholder approves the loan token contract to spend tokens on his behalf
   */
  approveToken(tokenAdr, loanToken, collateralToken) {
    this._isMounted && this.setState({ loading: true })
    //PENDING
    this.props.transactionComplete("pending", "")

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



    render() {
        const lendFunction = this.props.currency === "USDC" ? this.lendSUSD : this.lendRBTC
        const minValue = this.props.currency === "USDC" ? 1 : 0.01
        const maxValue = this.props.currency === "USDC" ? 50000 : 5
        const currency = this.props.currency === "USDC" ? "USD" : "BTC"
        
        return (
            <React.Fragment>
                <div className="token-selector-item__descriptions">
                    <div className="token-selector-item__description">
                        <div className="token-selector-item__deposit-label" style={{color: 'white'}}>
                            Enter deposit amount <h6 style={{display: "inline"}}>(min: {minValue}, max: {maxValue})</h6>:
                        </div>
                        <div className="token-selector-item__deposit-input right" style={{color: 'white'}}>
                            <input
                                  type="number"
                                  min={minValue}
                                  max={maxValue}
                                  value={this.state.depositAmount}
                                  onChange={this.handleDepositChange}
                            />
                            <span className="right">{currency}</span>
                        </div>
                     </div>  
                </div>
                <div className="token-selector-item__actions">
                    <button
                        className="token-selector-item__lend-button token-selector-item__lend-button--size-half"
                        onClick={lendFunction} 
                        disabled={this.state.depositAmount >= maxValue || this.state.depositAmount <= minValue}
                    >
                        Lend {currency}
                    </button>
                </div>
            </React.Fragment>
        )
    }

}

export default TestLend