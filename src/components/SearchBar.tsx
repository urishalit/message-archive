import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, I18nManager } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export function SearchBar({ value, onChangeText, onClear }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color="#999"
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder="חיפוש..."
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        textAlign="right"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 0,
  },
  clearBtn: {
    marginLeft: 6,
    padding: 2,
  },
});
