/**
 * Sample React Native App for react-tracing
 * @flow
 */

import React, { Component } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import * as Screens from "./Screens";

export default class App extends Component<{}> {
  state = {
    screen: false
  };

  renderScreenButton(title, component) {
    return (
      <TouchableOpacity
        onPress={() => {
          this.setState({ screen: component });
        }}
      >
        <Text style={{ color: "blue", marginBottom: 20 }}>{title}</Text>
      </TouchableOpacity>
    );
  }

  render() {
    if (!this.state.screen) {
      return (
        <View
          style={{
            flex: 1,
            paddingTop: 20,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Text style={{ fontSize: 20, marginBottom: 30 }}>Choose a test</Text>
          {this.renderScreenButton("Basic", Screens.BasicScreen)}
        </View>
      );
    }

    const Screen = this.state.screen;
    return <Screen />;
  }
}
