import React, { Component } from "react";

export default class BasicScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pressed: false
    };
  }

  render() {
    return (
      <div style={{ flex: 1, paddingTop: 40, justifyContent: "flex-start" }}>
        <a
          id="basicButton"
          onClick={() => {
            this.setState({ pressed: true });
          }}
        >
          <span id="buttonLabel">
            {this.state.pressed ? "Is-Pressed" : "Not-Pressed"}
          </span>
        </a>
      </div>
    );
  }
}
