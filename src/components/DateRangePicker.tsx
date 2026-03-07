import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface Props {
  startDate: Date;
  endDate: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
}

type PickerTarget = "startDate" | "startTime" | "endDate" | "endTime" | null;

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: Props) {
  const [showPicker, setShowPicker] = useState<PickerTarget>(null);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") {
      setShowPicker(null);
      return;
    }
    if (!date) return;

    if (showPicker === "startDate" || showPicker === "startTime") {
      onStartChange(date);
    } else {
      onEndChange(date);
    }
    setShowPicker(null);
  };

  const formatDate = (d: Date) => d.toLocaleDateString();
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>מ-</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPicker("startDate")}
        >
          <Text style={styles.buttonText}>{formatDate(startDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPicker("startTime")}
        >
          <Text style={styles.buttonText}>{formatTime(startDate)}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>עד</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPicker("endDate")}
        >
          <Text style={styles.buttonText}>{formatDate(endDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowPicker("endTime")}
        >
          <Text style={styles.buttonText}>{formatTime(endDate)}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={
            showPicker.startsWith("start") ? startDate : endDate
          }
          mode={showPicker.endsWith("Date") ? "date" : "time"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    color: "#333",
  },
});
