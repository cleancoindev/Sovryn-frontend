import { BigNumber } from "@0x/utils";
import React, { Component } from "react";
import TagManager from "react-gtm-module";
import { Asset } from "../domain/Asset";
import { AssetDetails } from "../domain/AssetDetails";
import { AssetsDictionary } from "../domain/AssetsDictionary";
import { IPriceDataPoint } from "../domain/IPriceDataPoint";
import { PositionType } from "../domain/PositionType";
import { TradeRequest } from "../domain/TradeRequest";
import { TradeTokenKey } from "../domain/TradeTokenKey";
import { TradeType } from "../domain/TradeType";
import { FulcrumProviderEvents } from "../services/events/FulcrumProviderEvents";
import { ProviderChangedEvent } from "../services/events/ProviderChangedEvent";
import { TradeTransactionMinedEvent } from "../services/events/TradeTransactionMinedEvent";
import { FulcrumProvider } from "../services/FulcrumProvider";
import { PositionTypeMarkerAlt } from "./PositionTypeMarkerAlt";
import siteConfig from "../config/SiteConfig.json";

import { LeverageSelector } from "./LeverageSelector";
import { PositionTypeMarker } from "./PositionTypeMarker";
import { Preloader } from "./Preloader";

import { InterestRateProvider} from "../services/InterestRateProvider";
import Web3 from "web3";
import Test from './Test'

const iRateProvider = new InterestRateProvider();

export interface ITradeTokenGridRowProps {
  selectedKey: TradeTokenKey;

  asset: Asset;
  defaultUnitOfAccount: Asset;
  positionType: PositionType;
  defaultLeverage: number;
  defaultTokenizeNeeded: boolean;
  isMobileMedia?: boolean;

  onSelect: (key: TradeTokenKey) => void;
  onTrade: (request: TradeRequest) => void;
}

interface ITradeTokenGridRowState {
  assetDetails: AssetDetails | null;
  leverage: number;
  version: number;

  latestPriceDataPoint: IPriceDataPoint;
  interestRate: BigNumber;
  balance: BigNumber;
  isLoading: boolean;
  pTokenAddress: string;
  transactionStatus: string;
  transactionResult: any;
  depositValue: number;
}

export class TradeTokenGridRow extends Component<ITradeTokenGridRowProps, ITradeTokenGridRowState> {
  constructor(props: ITradeTokenGridRowProps, context?: any) {
    super(props, context);
    
    const assetDetails = AssetsDictionary.assets.get(props.asset);
    this._isMounted = false;
    this.state = {
      leverage: this.props.defaultLeverage,
      assetDetails: assetDetails || null,
      latestPriceDataPoint: 
        FulcrumProvider.Instance.getPriceDefaultDataPoint(),
      interestRate: new BigNumber(0),
      balance: new BigNumber(0),
      version: 2,
      isLoading: true,
      pTokenAddress: "",
      transactionStatus: "",
      transactionResult: {},
      depositValue: 0
    };

    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderAvailable, this.onProviderAvailable);
    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
    FulcrumProvider.Instance.eventEmitter.on(FulcrumProviderEvents.TradeTransactionMined, this.onTradeTransactionMined);
    
    this.transactionComplete = this.transactionComplete.bind(this)
    this.handleDepositChange = this.handleDepositChange.bind(this)

  }

  private _isMounted: boolean;

  private getTradeTokenGridRowSelectionKeyRaw(props: ITradeTokenGridRowProps, leverage: number = this.state.leverage) {
    const key = new TradeTokenKey(
      props.asset,
      props.defaultUnitOfAccount,
      props.positionType,
      leverage,
      props.defaultTokenizeNeeded,
      2
    );

    // check for version 2, and revert back to version if not found
    if (key.erc20Address === "") {
      key.setVersion(1);
    }

    return key;
  }

  private getTradeTokenGridRowSelectionKey(leverage: number = this.state.leverage) {
    return this.getTradeTokenGridRowSelectionKeyRaw(this.props, leverage);
  }

  private async derivedUpdate() {
    let version = 2;
    const tradeTokenKey = new TradeTokenKey(
      this.props.asset,
      this.props.defaultUnitOfAccount,
      this.props.positionType,
      this.state.leverage,
      this.props.defaultTokenizeNeeded,
      version
    );
    if (tradeTokenKey.erc20Address === "") {
      tradeTokenKey.setVersion(1);
      version = 1;
    }
    
    //DUMMY VALUES FOR TESTING
    const latestPriceDataPoint = {
      change24h: 12,
      liquidationPrice: this.calcLiquidationPrice(10000, this.state.leverage, tradeTokenKey.positionType),
      price: 10000,
      timeStamp: new Date().valueOf()
    }

      //await FulcrumProvider.Instance.getTradeTokenAssetLatestDataPoint(tradeTokenKey);
    
    const interestRate = new BigNumber(await iRateProvider.getBorrowInterestRate(tradeTokenKey.positionType, 0));//new BigNumber(1.75)
    
    //await FulcrumProvider.Instance.getTradeTokenInterestRate(tradeTokenKey);
    
    const balance = await FulcrumProvider.Instance.getPTokenBalanceOfUser(tradeTokenKey);

    const pTokenAddress = FulcrumProvider.Instance.contractsSource ?
      FulcrumProvider.Instance.contractsSource.getPTokenErc20Address(tradeTokenKey) || "" :
      "";

    // const latestPriceDataPoint = await FulcrumProvider.Instance.getTradeTokenAssetLatestDataPoint(tradeTokenKey);
    // const interestRate = await FulcrumProvider.Instance.getTradeTokenInterestRate(tradeTokenKey);
    // const balance = await FulcrumProvider.Instance.getPTokenBalanceOfUser(tradeTokenKey);

    // const pTokenAddress = FulcrumProvider.Instance.contractsSource
    //   ? (await FulcrumProvider.Instance.contractsSource.getPTokenErc20Address(tradeTokenKey)) || ""
    //   : "";

    this._isMounted &&
      this.setState(p => ({
        ...this.state,
        latestPriceDataPoint: latestPriceDataPoint,
        interestRate: interestRate,
        balance: balance,
        version: version,
        isLoading: latestPriceDataPoint.price !== 0 ? false : true,
        pTokenAddress: pTokenAddress
      }));
  }
  
   /**
   * calculates the liquidation price depending on the current price and leverage
   * */
  private calcLiquidationPrice = (price:number, leverage:number, positionType:string) => {
    //hardcoded here, but should be read from the margin pool params on the smart contract
    const maintenanceMargin:number = 0.15;
    const maxPriceMovement = 1/leverage - maintenanceMargin;
    if(positionType === "LONG")
      return (1 - maxPriceMovement) * price; 
    else
      return (1 + maxPriceMovement) * price;
  }

  private onProviderAvailable = async () => {
    await this.derivedUpdate();
  };

  private onProviderChanged = async (event: ProviderChangedEvent) => {
    await this.derivedUpdate();
  };

  private onTradeTransactionMined = async (event: TradeTransactionMinedEvent) => {
    if (event.key.toString() === this.getTradeTokenGridRowSelectionKey().toString()) {
      await this.derivedUpdate();
    }
  };

  public componentWillUnmount(): void {
    this._isMounted = false;

    FulcrumProvider.Instance.eventEmitter.removeListener(
      FulcrumProviderEvents.ProviderAvailable,
      this.onProviderAvailable
    );
    FulcrumProvider.Instance.eventEmitter.removeListener(FulcrumProviderEvents.ProviderChanged, this.onProviderChanged);
    FulcrumProvider.Instance.eventEmitter.removeListener(
      FulcrumProviderEvents.TradeTransactionMined,
      this.onTradeTransactionMined
    );
  }

  public componentDidMount(): void {
    this._isMounted = true;

    this.derivedUpdate();
  }

  public componentDidUpdate(
    prevProps: Readonly<ITradeTokenGridRowProps>,
    prevState: Readonly<ITradeTokenGridRowState>,
    snapshot?: any
  ): void {
    const currentTradeTokenKey = this.getTradeTokenGridRowSelectionKey(this.state.leverage);
    const prevTradeTokenKey = this.getTradeTokenGridRowSelectionKeyRaw(prevProps, prevState.leverage);

    if (
      prevState.leverage !== this.state.leverage ||
      (prevProps.selectedKey.toString() === prevTradeTokenKey.toString()) !==
        (this.props.selectedKey.toString() === currentTradeTokenKey.toString())
    ) {
      this.derivedUpdate();
    }
  }

  public render() {
    if (!this.state.assetDetails) {
      return null;
    }

    const tradeTokenKey = this.getTradeTokenGridRowSelectionKey(this.state.leverage);
    const bnPrice = new BigNumber(this.state.latestPriceDataPoint.price);
    const bnLiquidationPrice = new BigNumber(this.state.latestPriceDataPoint.liquidationPrice);
    
    /*if (this.props.positionType === PositionType.SHORT) {
      bnPrice = bnPrice.div(1000);
      bnLiquidationPrice = bnLiquidationPrice.div(1000);
    }*/
    // bnPrice = bnPrice.div(1000);
    // bnLiquidationPrice = bnLiquidationPrice.div(1000);

    // const bnChange24h = new BigNumber(this.state.latestPriceDataPoint.change24h);
    const isActiveClassName =
      tradeTokenKey.toString() === this.props.selectedKey.toString() ? "trade-token-grid-row--active" : "";

    const minValue = this.props.positionType === PositionType.SHORT ? 1 : 0.01
    const maxValue = this.props.positionType === PositionType.SHORT ? 50000 : 1
    const currency= this.props.positionType === PositionType.SHORT ? "USD" : "RBTC"
    /*if (this.props.positionType === PositionType.SHORT) {
      bnPrice = bnPrice.div(1000);
      bnLiquidationPrice = bnLiquidationPrice.div(1000);
    }*/
    // bnPrice = bnPrice.div(1000);
    // bnLiquidationPrice = bnLiquidationPrice.div(1000);

    // const bnChange24h = new BigNumber(this.state.latestPriceDataPoint.change24h);

    return this.props.isMobileMedia
      ? this.renderMobile(isActiveClassName.toString(), bnPrice, bnLiquidationPrice)
      : this.renderDesktop(isActiveClassName.toString(), bnPrice, bnLiquidationPrice, maxValue, minValue, currency);
  }



  private renderAssetPrice = (price: BigNumber) =>
    !this.state.isLoading ? (
      <React.Fragment>
        <span className="fw-normal">$</span>
        <span className="highlight">{price.toFixed(2)}</span>
      </React.Fragment>
    ) : (
      <Preloader width={this.props.isMobileMedia ? "74px" : "100px"} />
    );

  private renderLiquidationPrice = (price: BigNumber) =>
    !this.state.isLoading ? (
      <React.Fragment>
        <span className="fw-normal">$</span>
        <span className="highlight">{price.toFixed(2)}</span>
      </React.Fragment>
    ) : (
      <Preloader width={this.props.isMobileMedia ? "74px" : "100px"} />
    );

  private renderInterestRate = () =>
    this.state.interestRate.gt(0) && !this.state.isLoading ? (
      <React.Fragment>
        <span className="highlight">{this.state.interestRate.toFixed(4)}</span>
        <span className="fw-normal">%</span>
      </React.Fragment>
    ) : (
      <Preloader width={this.props.isMobileMedia ? "74px" : "100px"} />
    );

  private renderLeverageSelector = (min: number, max: number) => (
    <LeverageSelector
      asset={this.props.asset}
      value={this.state.leverage}
      minValue={min}
      maxValue={max}
      onChange={this.onLeverageSelect}
    />
  );

  private renderDesktop = (isActiveClassName: string, bnPrice: BigNumber, bnLiquidationPrice: BigNumber, maxValue: any, minValue: any, currency: any) => (
    <React.Fragment>
    <div className={`trade-token-grid-block ${isActiveClassName}`} onClick={this.onSelectClick}>
      <div className="row">
        <div className="row-left">{this.renderLeverageSelector(1, 5)}</div>
        <div className="row-right">
          <Test 
            position={this.props.positionType} 
            transactionComplete={this.transactionComplete}
            leverage={this.state.leverage}
            depositValue={this.state.depositValue}
            maxValue={maxValue}
            minValue={minValue}
          />
        </div>
      </div>
      <div className="row">
          <span>Asset Price</span>
          <span className="row-data">{this.renderAssetPrice(bnPrice)}</span>
      </div>
      <div className="row">
          <span>Liquidation Price</span>
          <span className="row-data">{this.renderLiquidationPrice(bnLiquidationPrice)}</span>
      </div>
  	  <div className="row">
            <span>Interest APR</span>
            <span className="row-data">{this.renderInterestRate()}</span>
      </div>
        <div className="row">
            <div className="row-left"> 
                <span style={{color: "white"}}>Enter deposit amount</span> <h6 style={{display: "inline"}}>(min: {minValue}, max: {maxValue})</h6>
            </div>
            <div className="row-right" style={{textAlign: "center"}}>
                <input
                  className="trade-form__long-input"
                  style={{borderRadius: "8px", textAlign: "center"}}
                  type="number"
                  min={minValue}
                  max={maxValue}
                  value={this.state.depositValue}
                  onChange={this.handleDepositChange}
                />
                <span style={{color: "grey"}}>{currency}</span>
            </div>
        </div>
        </div>
          {this.state.transactionStatus.length > 0 &&
          <div className="trade-token-grid-block row-results">
            <div className="row">
              <div className="row-left">
                <span className="trade-token-grid-row__transaction-status">Transaction status</span>
              </div>
              <div className="row-right">
                <React.Fragment>
                  <span className="highlight">{this.state.transactionStatus}</span>
                  {this.state.transactionStatus === "pending" &&
                    <Preloader width="74px"/>
                  }
                  {this.state.transactionStatus === "approved" &&
                    <Preloader width="74px"/>
                  }
                </React.Fragment>
              </div>
            </div>
            {this.state.transactionResult &&
              <React.Fragment>
                <div className="row">
                  <div className="row-left">
                    <span><a href={"https://explorer.testnet.rsk.co/tx/" + this.state.transactionResult.transactionHash} target="_blank">See on RSK explorer</a></span><br />
                  </div>
                </div>
                <div className="row">
                  <div className="row-left"><span>Position size </span></div>
                  <div className="row-right highlight">{this.state.transactionResult.positionSize}</div>
                </div>
                <div className="row">
                  <div className="row-left"><span> Entry price</span></div>
                  <div className="row-right highlight">{this.state.transactionResult.entryPrice}</div>
                </div>
              </React.Fragment>
            }
            </div>
          }
      </React.Fragment>
  );

  private renderMobile = (isActiveClassName: string, bnPrice: BigNumber, bnLiquidationPrice: BigNumber) => (
    <div className={`trade-token-grid-row ${isActiveClassName}`} onClick={this.onSelectClick}>
      <div className="trade-token-grid-row__col-token-name">
       
      </div>
      <div className="trade-token-grid-row__col-position-type">
        <PositionTypeMarker value={this.props.positionType} />
      </div>
      <div className="trade-token-grid-row__col-leverage">
        <div className="leverage-selector__wrapper">{this.renderLeverageSelector(1, 5)}</div>
      </div>
      <div title={`$${bnPrice.toFixed(18)}`} className="trade-token-grid-row__col-price">
        {this.renderAssetPrice(bnPrice)}
      </div>
      <div title={`$${bnLiquidationPrice.toFixed(18)}`} className="trade-token-grid-row__col-price">
        {this.renderLiquidationPrice(bnLiquidationPrice)}
      </div>
      <div
        title={this.state.interestRate.gt(0) ? `${this.state.interestRate.toFixed(18)}%` : ``}
        className="trade-token-grid-row__col-profit"
      >
        {this.renderInterestRate()}
      </div>
      {this.renderActions(this.state.balance.eq(0))}
    </div>
  );

  public transactionComplete = (status: string, result: any) => {
    //alert(`Transaction status: ${status} \nTransaction result: ${result}`)
    if(status === "pending") {
      this._isMounted && this.setState({...this.state, transactionStatus: status, transactionResult: result, depositValue: 0})
    } else {
      this._isMounted && this.setState({...this.state, transactionStatus: status, transactionResult: result})
    }
  }
  
  private handleDepositChange = (e: any) => {
    const { value } = e.target
    this._isMounted && this.setState({...this.state, depositValue: value})
  }
  
  private renderActions = (isBuyOnly: boolean) => {
    return (
      <div className="trade-token-grid-row__col-action">
        <button
          className="trade-token-grid-row__buy-button trade-token-grid-row__button--size-half"
          disabled={siteConfig.TradeBuyDisabled}
          onClick={this.onBuyClick}
        >
          {TradeType.BUY}
        </button>
      </div>
    );
  };

  public onLeverageSelect = (value: number) => {
    const key = this.getTradeTokenGridRowSelectionKey(value);

    this._isMounted && this.setState({ ...this.state, leverage: value, version: key.version, isLoading: true });

    this.props.onSelect(this.getTradeTokenGridRowSelectionKey(value));
  };

  public onSelectClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onSelect(this.getTradeTokenGridRowSelectionKey());
  };

  public onBuyClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    this.props.onTrade(
      new TradeRequest(
        TradeType.BUY,
        this.props.asset,
        this.props.defaultUnitOfAccount, // TODO: depends on which one they own
        Asset.ETH,
        this.props.positionType,
        this.state.leverage,
        new BigNumber(0),
        this.props.defaultTokenizeNeeded, // TODO: depends on which one they own
        this.state.version
      )
    );
  };

  public onSellClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    this.props.onTrade(
      new TradeRequest(
        TradeType.SELL,
        this.props.asset,
        this.props.defaultUnitOfAccount, // TODO: depends on which one they own
        this.props.selectedKey.positionType === PositionType.SHORT ? this.props.selectedKey.asset : Asset.DAI,
        this.props.positionType,
        this.state.leverage,
        new BigNumber(0),
        this.props.defaultTokenizeNeeded, // TODO: depends on which one they own
        this.state.version
      )
    );
  };
}
