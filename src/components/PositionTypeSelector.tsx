import React, { Component } from "react";
import { PositionType } from "../domain/PositionType";

export interface IPositionTypeSelectorProps {
  onChange?: (value: PositionType) => void;
  value: PositionType;
}

export class PositionTypeSelector extends Component<IPositionTypeSelectorProps> {
  public render() {
    return (
      <div className="poisition-type-switch">
        <button
          className={"" + (this.props.value == PositionType.LONG ? "btn-active" : "")}
          onClick={() => this.props.onChange && this.props.onChange(PositionType.LONG)}
        >
          Long
        </button>
        <button
          className={"" + (this.props.value == PositionType.SHORT ? "btn-active" : "")}
          onClick={() => this.props.onChange && this.props.onChange(PositionType.SHORT)}
        >
          Short
        </button>
      </div>
    );
  }
}
