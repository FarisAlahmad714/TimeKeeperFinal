import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import SearchableDropdown from 'react-native-searchable-dropdown';
import moment from 'moment-timezone';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Button, Dialog, Portal } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const numColumns = 2;

const timezones = moment.tz.names().map(tz => {
  const cityName = tz.split('/').pop().replace('_', ' ');
  return { id: tz, name: `${cityName} (${tz})` };
});

const WorldClockScreen = () => {
  const [clocks, setClocks] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [isAddClockModalVisible, setIsAddClockModalVisible] = useState(false);

  useEffect(() => {
    loadClocks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadClocks = async () => {
    try {
      const savedClocks = await AsyncStorage.getItem('clocks');
      if (savedClocks) {
        setClocks(JSON.parse(savedClocks));
      }
    } catch (error) {
      console.error('Failed to load clocks', error);
    }
  };

  const saveClocks = async (newClocks) => {
    try {
      await AsyncStorage.setItem('clocks', JSON.stringify(newClocks));
    } catch (error) {
      console.error('Failed to save clocks', error);
    }
  };

  const addClock = () => {
    if (selectedTimezone) {
      if (clocks.length >= 10) {
        Alert.alert('Limit reached', 'You can only add up to 10 clocks.');
        return;
      }
      const newClocks = [...clocks, { timezone: selectedTimezone }];
      setClocks(newClocks);
      saveClocks(newClocks);
      setSelectedTimezone(null);
      setIsAddClockModalVisible(false);
    } else {
      Alert.alert('No timezone selected', 'Please select a timezone to add.');
    }
  };

  const deleteClock = async (index) => {
    const newClocks = [...clocks];
    newClocks.splice(index, 1);
    setClocks(newClocks);
    await saveClocks(newClocks);
  };

  const renderClockItem = ({ item, index }) => {
    const currentClockTime = moment().tz(item.timezone);
    return (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteClock(index)}
          >
            <Icon name="delete" size={24} color="white" />
          </TouchableOpacity>
        )}
      >
        <Card style={styles.clockItem}>
          <Card.Content>
            <Text style={styles.clockTimezone}>{item.timezone.split('/').pop().replace('_', ' ')}</Text>
            <Text style={styles.clockTime}>{currentClockTime.format('hh:mm:ss A')}</Text>
          </Card.Content>
        </Card>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <Button icon="plus" mode="contained" onPress={() => setIsAddClockModalVisible(true)}>
        Add Clock
      </Button>
      <FlatList
        data={clocks}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderClockItem}
        extraData={currentTime}
        numColumns={numColumns}
        contentContainerStyle={styles.flatListContainer}
      />
      <Portal>
        <Dialog visible={isAddClockModalVisible} onDismiss={() => setIsAddClockModalVisible(false)}>
          <Dialog.Content>
            <Text>Select a City/Country</Text>
            <SearchableDropdown
              onItemSelect={item => {
                setSelectedTimezone(item.id);
              }}
              items={timezones}
              placeholder="Select a city/country"
              resetValue={false}
              textInputProps={{
                placeholder: "Select a city/country",
                underlineColorAndroid: "transparent",
                style: {
                  height: 40,
                  borderColor: 'gray',
                  borderWidth: 1,
                  marginBottom: 12,
                  paddingHorizontal: 8,
                  borderRadius: 5,
                }
              }}
              listProps={{
                nestedScrollEnabled: true,
              }}
            />
            {selectedTimezone && (
              <Text style={styles.selectedTimezoneText}>
                Selected Timezone: {selectedTimezone}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={addClock}>Add Clock</Button>
            <Button onPress={() => setIsAddClockModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  flatListContainer: {
    alignItems: 'center', // Center align items horizontally
  },
  clockItem: {
    flex: 1,
    margin: 5,
    maxWidth: (width / numColumns) - 20, // Ensure consistent item size
  },
  clockTimezone: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clockTime: {
    fontSize: 16,
    color: '#777',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  selectedTimezoneText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});

export default WorldClockScreen;

