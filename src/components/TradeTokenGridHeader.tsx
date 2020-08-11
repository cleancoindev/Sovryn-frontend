import React, { Component, Fragment } from "react";
import { LeverageSelector } from "./LeverageSelector";
import { AssetDetails } from "../domain/AssetDetails";
import { PositionTypeMarkerAlt } from "./PositionTypeMarkerAlt";
import { AssetsDictionary } from "../domain/AssetsDictionary";
import { PositionType } from "../domain/PositionType";
import { Asset } from "../domain/Asset";
import { PositionTypeSelector } from "./PositionTypeSelector";

export interface ITradeTokenGridHeaderProps {
  showMyTokensOnly: boolean;
  isMobileMedia?: boolean;
  asset?: Asset;
  positionType?: PositionType;
  onPositionTypeChange?: (value: string) => void;
}

interface ITradeTokenGridHeaderState {
  positionType: PositionType;
}

export class TradeTokenGridHeader extends Component<ITradeTokenGridHeaderProps, ITradeTokenGridHeaderState> {
  constructor(props: ITradeTokenGridHeaderProps) {
    super(props);
    this.state = {
      positionType: this.props.positionType || PositionType.SHORT
    };
  }

  private onPositionTypeChange = (positionType: PositionType) => {
    this.setState({
      positionType
    });
    this.props.onPositionTypeChange &&
      this.props.onPositionTypeChange(positionType == PositionType.LONG ? "long" : "short");
  };

  public render() {
    const asset = this.props.asset || Asset.UNKNOWN;
    const assetDetails = AssetsDictionary.assets.get(asset);

    return (
      <Fragment>
        <div className="trade-token-grid-header">
          <div className="trade-token-grid-row__col-token-name">
            {assetDetails ? (
              <a
                className="trade-token-grid-row__col-token-name--inner"
              >
                {assetDetails.displayName}
                <PositionTypeMarkerAlt assetDetails={assetDetails} value={this.state.positionType} />
              </a>
            ) : null}
          </div>
          <div className="trade-token-grid-row__col-position">
            <PositionTypeSelector
              onChange={(positionType: PositionType) => this.onPositionTypeChange(positionType)}
              value={this.state.positionType}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}
