import React, { Component } from "react";
import { AppRegistry, TouchableOpacity, Text, View } from "react-native";
import BasicScreen from "./Screens/Basic";

export default class App extends Component {
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
          {this.renderScreenButton("Basic", BasicScreen)}
        </View>
      );
    }

    const Screen = this.state.screen;
    return <Screen />;
  }
}

AppRegistry.registerComponent("reactNativeExample", () => App);
