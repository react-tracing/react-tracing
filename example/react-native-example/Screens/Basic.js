import React, { Component } from "react";
import { Text, View, TouchableOpacity } from "react-native";

export default class BasicScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pressed: false
    };
  }

  render() {
    return (
      <View style={{ flex: 1, paddingTop: 40, justifyContent: "flex-start" }}>
        <TouchableOpacity
          testID="basicButton"
          onPress={() => {
            this.setState({ pressed: true });
          }}
        >
          <Text testID="buttonLabel">
            {this.state.pressed ? "Pressed" : "Not Pressed"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
