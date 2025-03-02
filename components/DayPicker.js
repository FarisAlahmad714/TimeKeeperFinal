// DayPicker.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const daysOfWeek = [
  { day: 'Sunday', value: 'SU' },
  { day: 'Monday', value: 'MO' },
  { day: 'Tuesday', value: 'TU' },
  { day: 'Wednesday', value: 'WE' },
  { day: 'Thursday', value: 'TH' },
  { day: 'Friday', value: 'FR' },
  { day: 'Saturday', value: 'SA' },
];

const DayPicker = ({ selectedDays, setSelectedDays }) => {
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <View style={styles.dayPickerContainer}>
      {daysOfWeek.map(({ day, value }) => (
        <TouchableOpacity
          key={value}
          style={[
            styles.dayButton,
            selectedDays.includes(value) && styles.selectedDayButton,
          ]}
          onPress={() => toggleDay(value)}
        >
          <Text
            style={[
              styles.dayButtonText,
              selectedDays.includes(value) && styles.selectedDayButtonText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  dayPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayButton: {
    margin: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  selectedDayButton: {
    backgroundColor: '#007BFF',
  },
  dayButtonText: {
    color: '#000',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
});

export default DayPicker;
