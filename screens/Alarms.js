import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Image, Switch, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, Card, TextInput, Dialog, Portal, Paragraph } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import * as Notifications from 'expo-notifications';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Audio } from 'expo-av';
import * as Asset from 'expo-asset';
import DayPicker from '../components/DayPicker'; // Ensure this import is correct

const singleAlarmIcon = require('../images/single.png');
const eventAlarmIcon = require('../images/event.png');

const Alarms = () => {
  const [alarms, setAlarms] = useState([]);
  const [isChoiceModalVisible, setIsChoiceModalVisible] = useState(false);
  const [isSingleAlarmModalVisible, setIsSingleAlarmModalVisible] = useState(false);
  const [isEventAlarmModalVisible, setIsEventAlarmModalVisible] = useState(false);
  const [isEditSingleAlarmModalVisible, setIsEditSingleAlarmModalVisible] = useState(false);
  const [isEditInstanceModalVisible, setIsEditInstanceModalVisible] = useState(false);
  const [isAddInstanceModalVisible, setIsAddInstanceModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [alarmName, setAlarmName] = useState('');
  const [alarmDescription, setAlarmDescription] = useState('');
  const [alarmTime, setAlarmTime] = useState(new Date());
  const [alarmDate, setAlarmDate] = useState(new Date());
  const [eventInstances, setEventInstances] = useState([]);
  const [wizardStep, setWizardStep] = useState(1);
  const [isNameValid, setIsNameValid] = useState(true);
  const [instanceRepeat, setInstanceRepeat] = useState('None');
  const [selectedDays, setSelectedDays] = useState([]); // Add this line
  const [date, setDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ringtoneSound, setRingtoneSound] = useState(null);
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [settings, setSettings] = useState({
    repeat: 'None',
    ringtone: 'Default',
    snooze: false,
  });

  const [testRepeatInterval, setTestRepeatInterval] = useState('None'); // Add this line

  const handleOpenSettings = (alarm) => {
    setSelectedAlarm(alarm);
    setSettings({
      repeat: alarm.repeat || 'None',
      ringtone: alarm.ringtone || 'Default',
      snooze: alarm.snooze || false,
    });
    setIsSettingsModalVisible(true);
  };

  const handleCloseSettings = () => {
    setSelectedAlarm(null);
    setIsSettingsModalVisible(false);
  };

  const updateAlarmSettings = () => {
    if (!selectedAlarm) return;

    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === selectedAlarm.id) {
        return { ...alarm, ...settings };
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    saveAlarms(updatedAlarms);
    handleCloseSettings();
  };

  const preloadAssets = async () => {
    const assets = [
      require('../assets/sounds/Ringtone1.mp3'),
      require('../assets/sounds/Ringtone2.mp3'),
      require('../assets/sounds/Ringtone3.mp3'),
      require('../assets/sounds/default.mp3'),
    ];
    await Asset.loadAsync(assets);
  };

  useEffect(() => {
    preloadAssets();
    requestPermissions();
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const ringtoneValue = notification.request.content.sound;
        console.log('Notification received, sound:', ringtoneValue);
        if (ringtoneValue) {
          await loadRingtone(ringtoneValue); // Load the ringtone based on the value
          await playRingtone(); // Play the loaded ringtone
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: false, // Prevent the default sound from playing
          shouldSetBadge: false,
        };
      },
    });
    loadAlarms();
  }, []);

  const loadRingtone = async (selectedRingtone) => {
    try {
      let ringtonePath;

      switch (selectedRingtone) {
        case 'Ringtone1':
          ringtonePath = require('../assets/sounds/Ringtone1.mp3');
          break;
        case 'Ringtone2':
          ringtonePath = require('../assets/sounds/Ringtone2.mp3');
          break;
        case 'Ringtone3':
          ringtonePath = require('../assets/sounds/Ringtone3.mp3');
          break;
        default:
          ringtonePath = require('../assets/sounds/default.mp3');
          break;
      }

      console.log('Selected ringtone:', selectedRingtone, 'Path:', ringtonePath);

      if (ringtonePath) {
        const newSound = new Audio.Sound();
        await newSound.loadAsync(ringtonePath);
        setRingtoneSound(newSound);
        console.log('Ringtone loaded successfully:', selectedRingtone);
      } else {
        console.log('Invalid ringtone path for:', selectedRingtone);
      }
    } catch (error) {
      console.log('Error loading ringtone:', error, 'Selected Ringtone:', selectedRingtone);
    }
  };

  const playRingtone = async () => {
    try {
      if (ringtoneSound) {
        console.log('Playing ringtone...');
        await ringtoneSound.playAsync();
      } else {
        console.log('Ringtone sound is not loaded yet.');
      }
    } catch (error) {
      console.log('Error playing ringtone:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (ringtoneSound) {
        console.log('Unloading ringtone...');
        ringtoneSound.unloadAsync();
      }
    };
  }, [ringtoneSound]);

  const saveAlarms = async (alarms) => {
    try {
      if (!alarms) {
        console.error('Alarms array is undefined');
        return;
      }
      await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
      console.log('Alarms saved:', JSON.stringify(alarms, null, 2));
    } catch (error) {
      console.error('Failed to save alarms', error);
    }
  };

  const loadAlarms = async () => {
    try {
      const savedAlarms = await AsyncStorage.getItem('alarms');
      if (savedAlarms) {
        const loadedAlarms = JSON.parse(savedAlarms);
        setAlarms(loadedAlarms);
        console.log('Alarms loaded:', JSON.stringify(loadedAlarms, null, 2));
      } else {
        setAlarms([]);
      }
    } catch (error) {
      console.error('Failed to load alarms', error);
      setAlarms([]);
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission not granted', 'You need to enable notifications in settings.');
      }
    }
  };

  const addAlarm = async () => {
    if ((isSingleAlarmModalVisible && (!alarmTime || !alarmDate)) ||
        (isEventAlarmModalVisible && eventInstances.length === 0)) {
        Alert.alert('Incomplete Instance', 'Please set both time and date.');
        return;
    }

    const newAlarm = {
        id: Date.now().toString(),
        name: alarmName,
        description: alarmDescription,
        times: isSingleAlarmModalVisible ? [alarmTime.toISOString()] : eventInstances.map(instance => instance.time.toISOString()),
        dates: isSingleAlarmModalVisible ? [alarmDate.toISOString()] : eventInstances.map(instance => instance.date.toISOString()),
        instances: isEventAlarmModalVisible ? eventInstances.map(instance => ({ ...instance, id: Date.now().toString() + Math.random().toString(), repeat: instanceRepeat })) : [],
        status: true, // default status is true (enabled)
        ...settings, // Include settings here
    };

    console.log('Adding new alarm:', JSON.stringify(newAlarm, null, 2));

    const updatedAlarms = [...alarms, newAlarm];
    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);
    await scheduleNotifications(newAlarm);

    setAlarmName('');
    setAlarmDescription('');
    setAlarmTime(new Date());
    setAlarmDate(new Date());
    setEventInstances([]);
    setIsSingleAlarmModalVisible(false);
    setIsEventAlarmModalVisible(false);
    setIsChoiceModalVisible(false);
  };

  const scheduleNotifications = async (alarm) => {
    if (!alarm.status) {
      console.log('Skipping scheduling notifications for disabled alarm:', alarm.name);
      return;
    }

    const scheduleNotification = async (title, body, trigger, ringtone) => {
      console.log('Scheduling notification:', { title, body, trigger, ringtone });
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: ringtone,
        },
        trigger,
      });
    };

    const parseDate = (dateString, timeString) => {
      const date = new Date(dateString);
      const time = new Date(timeString);

      if (isNaN(date.getTime()) || isNaN(time.getTime())) {
        console.error("Invalid date or time provided:", dateString, timeString);
        return null;
      }

      date.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
      return date;
    };

    const getRepeatSettings = (repeatInterval) => {
      switch (repeatInterval) {
        case 'Daily':
          return { repeats: true, repeatInterval: 'day' };
        case 'Weekly':
          return { repeats: true, repeatInterval: 'week' };
        case 'Hourly':
          return { repeats: true, repeatInterval: 'hour' };
        case 'Minutely':
          return { repeats: true, repeatInterval: 'minute' };
        case 'Every5Seconds':
          return { seconds: 5, repeats: true }; // Add for testing
        case 'EveryMinute':
          return { seconds: 60, repeats: true }; // Add for testing
        default:
          return { repeats: false };
      }
    };

    const scheduleInstanceNotifications = async (instance) => {
      const triggerDate = parseDate(instance.date, instance.time);
      let repeatSettings = getRepeatSettings(instance.repeat);

      if (testRepeatInterval !== 'None') {
        repeatSettings = getRepeatSettings(testRepeatInterval);
      }

      if (triggerDate && triggerDate > new Date()) {
        await scheduleNotification(alarm.name, instance.description, { ...repeatSettings, date: triggerDate }, alarm.ringtone);
      }
    };

    if (alarm.instances && alarm.instances.length > 0) {
      for (let instance of alarm.instances) {
        await scheduleInstanceNotifications(instance);
      }
    } else {
      const triggerDate = parseDate(alarm.dates[0], alarm.times[0]);
      let repeatSettings = getRepeatSettings(alarm.repeat);

      if (testRepeatInterval !== 'None') {
        repeatSettings = getRepeatSettings(testRepeatInterval);
      }

      if (triggerDate && triggerDate > new Date()) {
        await scheduleNotification(alarm.name, alarm.description, { ...repeatSettings, date: triggerDate }, alarm.ringtone);
      }
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async notification => {
      const { request } = notification;
      const { content, trigger } = request;

      if (trigger && trigger.repeats) {
        const newTrigger = {
          date: new Date(trigger.date).getTime() + getRepeatIntervalInMs(trigger.repeatInterval),
          repeats: false,
        };

        await Notifications.scheduleNotificationAsync({
          content,
          trigger: newTrigger,
        });

        console.log('Rescheduled notification:', { content, newTrigger });
      }
    });

    return () => subscription.remove();
  }, []);

  const getRepeatIntervalInMs = (repeatInterval) => {
    switch (repeatInterval) {
      case 'minute':
        return 60000;
      case 'hour':
        return 3600000;
      case 'day':
        return 86400000;
      case 'week':
        return 604800000;
      default:
        return 0;
    }
  };

  const cancelNotifications = async (alarm) => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of notifications) {
      if (notification.content.title === alarm.name) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log('Canceled notification:', notification.identifier);
      }
    }
  };

  const onTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      setAlarmTime(selectedTime);
    }
  };

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setAlarmDate(selectedDate);
    }
  };

  const deleteAlarm = async (id) => {
    const alarmToDelete = alarms.find(alarm => alarm.id === id);
    await cancelNotifications(alarmToDelete);
    const filteredAlarms = alarms.filter(alarm => alarm.id !== id);
    setAlarms(filteredAlarms);
    await saveAlarms(filteredAlarms);
  };

  const editAlarm = async (alarmId) => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        const updatedAlarm = {
          ...alarm,
          name: alarmName,
          description: alarmDescription,
          dates: [alarmDate.toISOString()],
          times: [alarmTime.toISOString()],
          repeat: settings.repeat,
          ringtone: settings.ringtone,
          snooze: settings.snooze,
        };
        return updatedAlarm;
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);

    const alarmToUpdate = updatedAlarms.find(alarm => alarm.id === alarmId);
    await cancelNotifications(alarmToUpdate);
    await scheduleNotifications(alarmToUpdate);

    console.log('Single alarm updated successfully:', alarmToUpdate);
    setIsEditSingleAlarmModalVisible(false);
  };

  const editEventAlarm = async (eventAlarmId, instanceIndex) => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === eventAlarmId) {
        const updatedInstances = alarm.instances.map((instance, index) => {
          if (index === instanceIndex) {
            const updatedInstance = {
              ...instance,
              date: alarmDate.toISOString(),
              time: alarmTime.toISOString(),
              description: alarmDescription,
            };
            return updatedInstance;
          }
          return instance;
        });
        const updatedAlarm = { ...alarm, instances: updatedInstances, repeat: settings.repeat, ringtone: settings.ringtone, snooze: settings.snooze };
        return updatedAlarm;
      }
      return alarm;
    });
    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);
    await cancelNotifications({ id: eventAlarmId });
    await scheduleNotifications(updatedAlarms.find(alarm => alarm.id === eventAlarmId));
    setIsEditInstanceModalVisible(false);
  };

  const updateInstance = async () => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === selectedEvent.id) {
        const updatedInstances = alarm.instances.map(instance => {
          if (instance.id === selectedInstance.id) {
            return {
              ...instance,
              date: alarmDate.toISOString(),
              time: alarmTime.toISOString(),
              description: alarmDescription,
            };
          }
          return instance;
        });
        return {
          ...alarm,
          instances: updatedInstances,
          times: updatedInstances.map(instance => instance.time),
          dates: updatedInstances.map(instance => instance.date),
        };
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);
    const alarmToUpdate = updatedAlarms.find(alarm => alarm.id === selectedEvent.id);
    await cancelNotifications(alarmToUpdate);
    await scheduleNotifications(alarmToUpdate);
    setIsEditInstanceModalVisible(false);
  };

  const toggleChoiceModal = () => {
    setIsChoiceModalVisible(!isChoiceModalVisible);
  };

  const handleEventAlarm = () => {
    setAlarmName('');
    setAlarmDescription('');
    setAlarmTime(new Date());
    setAlarmDate(new Date());
    setEventInstances([]);
    setWizardStep(1); // Reset wizard step to 1
    setIsNameValid(true);
    setIsEventAlarmModalVisible(true);
    setIsChoiceModalVisible(false);
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && !alarmName) {
      Alert.alert('Error', 'Please enter an alarm name.');
      return;
    }
    setWizardStep((prev) => prev + 1);
  };

  const handleRestart = () => {
    setAlarmName('');
    setAlarmDescription('');
    setAlarmTime(new Date());
    setAlarmDate(new Date());
    setEventInstances([]);
    setWizardStep(1);
    setInstanceRepeat('None');
  };

  const nextStep = () => {
    if (wizardStep === 1 && !alarmName) {
      setIsNameValid(false);
    } else {
      setWizardStep(wizardStep + 1);
    }
  };
  const prevStep = () => setWizardStep(wizardStep - 1);

  const handleSingleAlarm = () => {
    setAlarmName('');
    setAlarmDescription('');
    setAlarmTime(new Date());
    setAlarmDate(new Date());
    setIsSingleAlarmModalVisible(true);
    setIsChoiceModalVisible(false);
  };

  const handleEditSingleAlarm = (alarm) => {
    setSelectedEvent(alarm);
    setAlarmName(alarm.name);
    setAlarmDescription(alarm.description);
    setAlarmTime(new Date(alarm.times[0]));
    setAlarmDate(new Date(alarm.dates[0]));
    setIsEditSingleAlarmModalVisible(true);
  };

  const handleEditInstance = (event, instance, index) => {
    setSelectedEvent(event);
    setSelectedInstance({ ...instance, index });
    setAlarmTime(instance.time ? new Date(instance.time) : new Date());
    setAlarmDate(instance.date ? new Date(instance.date) : new Date());
    setAlarmDescription(instance.description || '');
    setIsEditInstanceModalVisible(true);
  };

  const handleAddInstance = (event) => {
    setSelectedEvent(event);
    setAlarmTime(new Date());
    setAlarmDate(new Date());
    setAlarmDescription('');
    setIsAddInstanceModalVisible(true);
  };

  const addEventInstance = () => {
    if (!alarmTime || !alarmDate || !alarmDescription) {
      Alert.alert('Incomplete Instance', 'Please set date, time, and description.');
      return;
    }

    const newInstance = {
      id: Date.now().toString() + Math.random().toString(),
      date: alarmDate,
      time: alarmTime,
      description: alarmDescription,
      repeat: instanceRepeat,
    };

    setEventInstances([...eventInstances, newInstance]);
    setAlarmTime(new Date());
    setAlarmDate(new Date());
    setAlarmDescription('');
    setInstanceRepeat('None'); // Reset repeat option
  };

  const addEventInstanceToExisting = async () => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === selectedEvent.id) {
        const newInstance = {
          id: Date.now().toString() + Math.random().toString(),
          date: alarmDate.toISOString(),
          time: alarmTime.toISOString(),
          description: alarmDescription,
          repeat: instanceRepeat,
        };
        const updatedInstances = alarm.instances ? [...alarm.instances, newInstance] : [newInstance];
        return { ...alarm, instances: updatedInstances, times: updatedInstances.map(instance => instance.time), dates: updatedInstances.map(instance => instance.date) };
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);
    const alarmToUpdate = alarms.find(alarm => alarm.id === selectedEvent.id);
    await cancelNotifications(alarmToUpdate);
    await scheduleNotifications(alarmToUpdate);
    setIsAddInstanceModalVisible(false);
    setInstanceRepeat('None'); // Reset repeat option
  };

  const renderRightActions = (progress, dragX, item) => {
    return (
      <RectButton style={styles.rightAction} onPress={() => deleteAlarm(item.id)}>
        <Text style={styles.actionText}>Delete</Text>
      </RectButton>
    );
  };

  // Function to handle switch toggle
  const toggleAlarmStatus = async (alarmId) => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        const updatedAlarm = { ...alarm, status: !alarm.status };
        return updatedAlarm;
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    await saveAlarms(updatedAlarms);

    const alarmToUpdate = updatedAlarms.find(alarm => alarm.id === alarmId);

    if (alarmToUpdate.status) {
      await scheduleNotifications(alarmToUpdate);
    } else {
      await cancelNotifications(alarmToUpdate);
    }
  };

  const SettingsDialog = ({ visible, onClose, repeat, setRepeat, ringtone, setRingtone, snooze, setSnooze, onSave }) => (
    <Dialog visible={visible} onDismiss={onClose}>
      <Dialog.Content>
        <Text style={styles.modalTitle}>Alarm Settings</Text>

        <Text>Repeat</Text>
        <Picker
          selectedValue={repeat}
          onValueChange={(itemValue) => setRepeat(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="None" value="None" />
          <Picker.Item label="Daily" value="Daily" />
          <Picker.Item label="Weekly" value="Weekly" />
          <Picker.Item label="Every Hour" value="Hourly" />
          <Picker.Item label="Every Minute" value="Minutely" />
        </Picker>

        <Text>Ringtone</Text>
        <Picker
          selectedValue={ringtone}
          onValueChange={(itemValue) => setRingtone(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Default" value="Default" />
          <Picker.Item label="Ringtone 1" value="Ringtone1" />
          <Picker.Item label="Ringtone 2" value="Ringtone2" />
        </Picker>

        <Text>Snooze</Text>
        <Switch
          value={snooze}
          onValueChange={(value) => setSnooze(value)}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onSave}>
          <Text>Update</Text>
        </Button>
        <Button onPress={onClose}>
          <Text>Close</Text>
        </Button>
      </Dialog.Actions>
    </Dialog>
  );

  const renderSingleAlarm = (item) => (
    <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
      <Card style={styles.alarmItem}>
        <Card.Content>
          <Image source={singleAlarmIcon} style={styles.alarmIcon} />
          <View style={styles.alarmDetails}>
            <TouchableOpacity onPress={() => handleEditSingleAlarm(item)}>
              <Paragraph style={styles.alarmName}>{item.name}</Paragraph>
              <Paragraph style={styles.alarmDescription}>{item.description}</Paragraph>
              <Paragraph style={styles.alarmTime}>{item.times.map(time => moment(time).format('hh:mm A')).join(', ')}</Paragraph>
              <Paragraph>{item.dates.map(date => moment(date).format('YYYY-MM-DD')).join(', ')}</Paragraph>
              {item.repeat !== 'None' && <Paragraph style={styles.repeatText}>Repeat {item.repeat}</Paragraph>}
            </TouchableOpacity>
          </View>
          <View style={styles.alarmActions}>
            <Switch
              value={item.status}
              onValueChange={() => toggleAlarmStatus(item.id)}
            />
          </View>
        </Card.Content>
      </Card>
    </Swipeable>
  );

  const renderEventAlarm = (item) => {
    const instances = item.instances || [];
    const groupedInstances = instances.reduce((acc, instance) => {
      const date = moment(instance.date).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(instance);
      return acc;
    }, {});

    return (
      <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
        <Card style={styles.alarmItem}>
          <Card.Content>
            <Image source={eventAlarmIcon} style={styles.alarmIcon} />
            <View style={styles.alarmDetails}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Paragraph style={styles.alarmName}>{item.name}</Paragraph>
                <TouchableOpacity onPress={() => handleAddInstance(item)}>
                  <Icon name="add" size={24} color="green" />
                </TouchableOpacity>
              </View>
              <Paragraph style={styles.alarmDescription}>{item.description}</Paragraph>
              {Object.keys(groupedInstances).map(date => (
                <View key={date} style={styles.groupedInstance}>
                  <Paragraph style={styles.dateText}>{date}</Paragraph>
                  {groupedInstances[date].map((instance) => (
                    <View key={instance.id} style={styles.instanceItem}>
                      <TouchableOpacity onPress={() => handleEditInstance(item, instance, instance.id)}>
                        <View style={styles.instanceItem}>
                          <Paragraph style={styles.alarmTime}>{moment(instance.time).format('hh:mm A')}</Paragraph>
                          <Paragraph style={styles.instanceDescription}> - {instance.description}</Paragraph>
                          {instance.repeat !== 'None' && <Paragraph style={styles.repeatText}>Repeat {instance.repeat}</Paragraph>}
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteInstance(item.id, instance.id)}>
                        <Icon name="delete" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.alarmActions}>
              <Switch
                value={item.status}
                onValueChange={() => toggleAlarmStatus(item.id)}
              />
            </View>
          </Card.Content>
        </Card>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <Button icon="plus" mode="contained" onPress={toggleChoiceModal}>Add Alarm</Button>
      <FlatList
        data={alarms || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          item.instances && item.instances.length > 0 ? renderEventAlarm(item) : renderSingleAlarm(item)
        )}
      />

      <Portal>
        <Dialog visible={isChoiceModalVisible} onDismiss={toggleChoiceModal}>
          <Dialog.Content>
            <TouchableOpacity style={styles.iconButton} onPress={handleSingleAlarm}>
              <Image source={singleAlarmIcon} style={styles.icon} />
              <Paragraph>Create Single Alarm</Paragraph>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleEventAlarm}>
              <Image source={eventAlarmIcon} style={styles.icon} />
              <Paragraph>Create Event Alarm</Paragraph>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={toggleChoiceModal}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isSingleAlarmModalVisible} onDismiss={() => setIsSingleAlarmModalVisible(false)}>
          <Dialog.Content>
            <Paragraph>Create Single Alarm</Paragraph>
            <TextInput
              style={styles.input}
              label="Alarm Name"
              value={alarmName}
              onChangeText={(text) => setAlarmName(text)}
            />
            <TextInput
              style={styles.input}
              label="Alarm Description"
              value={alarmDescription}
              onChangeText={(text) => setAlarmDescription(text)}
            />
            <Button onPress={() => setShowDatePicker(true)}>
              <Text>Set Date</Text>
            </Button>
            {showDatePicker && (
              <DateTimePicker
                value={alarmDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            <Button onPress={() => setShowTimePicker(true)}>
              <Text>Set Time</Text>
            </Button>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            <Text>Repeat Days</Text>
            <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
            <Text>Test Repeat Interval</Text>
            <Picker
              selectedValue={testRepeatInterval}
              onValueChange={(itemValue) => setTestRepeatInterval(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="None" value="None" />
              <Picker.Item label="Every 5 Seconds" value="Every5Seconds" />
              <Picker.Item label="Every Minute" value="EveryMinute" />
            </Picker>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={addAlarm}>
              <Text>Add Alarm</Text>
            </Button>
            <Button onPress={() => setIsSingleAlarmModalVisible(false)}>
              <Text>Close</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEventAlarmModalVisible} onDismiss={() => setIsEventAlarmModalVisible(false)}>
          <Dialog.Content>
            {wizardStep === 1 && (
              <>
                <Paragraph>Create Event Alarm - Step 1</Paragraph>
                <TextInput
                  style={styles.input}
                  label="Alarm Name"
                  value={alarmName}
                  onChangeText={(text) => setAlarmName(text)}
                />
              </>
            )}
            {wizardStep === 2 && (
              <>
                <Paragraph>Create Event Alarm - Step 2</Paragraph>
                <Button onPress={() => setShowDatePicker(true)}>Set Date</Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={alarmDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}
                <Button onPress={() => setShowTimePicker(true)}>Set Time</Button>
                {showTimePicker && (
                  <DateTimePicker
                    value={alarmTime}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
                <TextInput
                  style={styles.input}
                  label="Instance Description"
                  value={alarmDescription}
                  onChangeText={(text) => setAlarmDescription(text)}
                />
                <Text>Repeat Days</Text>
                <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
                <Text>Test Repeat Interval</Text>
                <Picker
                  selectedValue={testRepeatInterval}
                  onValueChange={(itemValue) => setTestRepeatInterval(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="None" value="None" />
                  <Picker.Item label="Every 5 Seconds" value="Every5Seconds" />
                  <Picker.Item label="Every Minute" value="EveryMinute" />
                </Picker>
                <Button onPress={addEventInstance}>Add Instance</Button>
                <FlatList
                  data={eventInstances}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.instanceItem}>
                      <Paragraph style={styles.alarmTime}>{moment(item.time).format('hh:mm A')}</Paragraph>
                      <Paragraph style={styles.instanceDescription}> - {item.description} - {moment(item.date).format('YYYY-MM-DD')}</Paragraph>
                    </View>
                  )}
                />
              </>
            )}
            {wizardStep === 3 && (
              <>
                <Paragraph>Create Event Alarm - Step 3</Paragraph>
                <FlatList
                  data={eventInstances}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.instanceItem}>
                      <Paragraph style={styles.alarmTime}>{moment(item.time).format('hh:mm A')}</Paragraph>
                      <Paragraph style={styles.instanceDescription}> - {item.description} - {moment(item.date).format('YYYY-MM-DD')}</Paragraph>
                      <Button onPress={() => handleEditInstance(selectedEvent, item, item.id)}>Edit</Button>
                      <Button onPress={() => deleteInstance(selectedEvent.id, item.id)}>Delete</Button>
                    </View>
                  )}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {wizardStep < 3 && (
              <Button onPress={handleNextStep}>
                <Text>Next</Text>
              </Button>
            )}
            {wizardStep === 3 && (
              <Button onPress={addAlarm}>
                <Text>Add Event Alarm</Text>
              </Button>
            )}
            <Button onPress={handleRestart}>
              <Text>Restart</Text>
            </Button>
            <Button onPress={() => setIsEventAlarmModalVisible(false)}>
              <Text>Close</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEditSingleAlarmModalVisible} onDismiss={() => setIsEditSingleAlarmModalVisible(false)}>
          <Dialog.Content>
            <Paragraph>Edit Single Alarm</Paragraph>
            <TextInput
              style={styles.input}
              label="Alarm Name"
              value={alarmName}
              onChangeText={(text) => setAlarmName(text)}
            />
            <TextInput
              style={styles.input}
              label="Alarm Description"
              value={alarmDescription}
              onChangeText={(text) => setAlarmDescription(text)}
            />
            <Button onPress={() => setShowDatePicker(true)}>Set Date</Button>
            {showDatePicker && (
              <DateTimePicker
                value={alarmDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setAlarmDate(selectedDate);
                  }
                }}
              />
            )}
            <Button onPress={() => setShowTimePicker(true)}>Set Time</Button>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    setAlarmTime(selectedTime);
                  }
                }}
              />
            )}
            <Text>Repeat Days</Text>
            <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
            <Text>Test Repeat Interval</Text>
            <Picker
              selectedValue={testRepeatInterval}
              onValueChange={(itemValue) => setTestRepeatInterval(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="None" value="None" />
              <Picker.Item label="Every 5 Seconds" value="Every5Seconds" />
              <Picker.Item label="Every Minute" value="EveryMinute" />
            </Picker>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => editAlarm(selectedEvent.id)}>Update Alarm</Button>
            <Button onPress={() => setIsEditSingleAlarmModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEditInstanceModalVisible} onDismiss={() => setIsEditInstanceModalVisible(false)}>
          <Dialog.Content>
            <Paragraph>Edit Event Instance</Paragraph>
            <Button onPress={() => setShowDatePicker(true)}>Set Date</Button>
            {showDatePicker && (
              <DateTimePicker
                value={alarmDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            <Button onPress={() => setShowTimePicker(true)}>Set Time</Button>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
              <TextInput
              style={styles.input}
              label="Instance Description"
              value={alarmDescription}
              onChangeText={(text) => setAlarmDescription(text)}
            />
            <Button onPress={() => setShowDatePicker(true)}>Set Date</Button>
            {showDatePicker && (
              <DateTimePicker
                value={alarmDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            <Button onPress={() => setShowTimePicker(true)}>Set Time</Button>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            <Text>Repeat Days</Text>
            <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
            <Text>Test Repeat Interval</Text>
            <Picker
              selectedValue={testRepeatInterval}
              onValueChange={(itemValue) => setTestRepeatInterval(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="None" value="None" />
              <Picker.Item label="Every 5 Seconds" value="Every5Seconds" />
              <Picker.Item label="Every Minute" value="EveryMinute" />
            </Picker>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => editAlarm(selectedEvent.id)}>Update Alarm</Button>
            <Button onPress={() => setIsEditSingleAlarmModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEditInstanceModalVisible} onDismiss={() => setIsEditInstanceModalVisible(false)}>
          <Dialog.Content>
            <Paragraph>Edit Event Instance</Paragraph>
            <Button onPress={() => setShowDatePicker(true)}>Set Date</Button>
            {showDatePicker && (
              <DateTimePicker
                value={alarmDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            <Button onPress={() => setShowTimePicker(true)}>Set Time</Button>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            <TextInput
              style={styles.input}
              label="Instance Description"
              value={alarmDescription}
              onChangeText={(text) => setAlarmDescription(text)}
            />
            <Text>Repeat Days</Text>
            <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
            <Text>Test Repeat Interval</Text>
            <Picker
              selectedValue={testRepeatInterval}
              onValueChange={(itemValue) => setTestRepeatInterval(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="None" value="None" />
              <Picker.Item label="Every 5 Seconds" value="Every5Seconds" />
              <Picker.Item label="Every Minute" value="EveryMinute" />
            </Picker>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={updateInstance}>Update Instance</Button>
            <Button onPress={() => setIsEditInstanceModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isAddInstanceModalVisible} onDismiss={() => setIsAddInstanceModalVisible(false)}>
          <Dialog.Content>
            <Paragraph>Add Event Instance</Paragraph>
            <Button onPress={() => setShowDatePicker(true)}>Set Date</Button>
            {showDatePicker && (
              <DateTimePicker
                value={alarmDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            <Button onPress={() => setShowTimePicker(true)}>Set Time</Button>
            {showTimePicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
            <TextInput
              style={styles.input}
              label="Instance Description"
              value={alarmDescription}
              onChangeText={(text) => setAlarmDescription(text)}
            />
            <Text>Repeat Days</Text>
            <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
            <Text>Test Repeat Interval</Text>
            <Picker
              selectedValue={testRepeatInterval}
              onValueChange={(itemValue) => setTestRepeatInterval(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="None" value="None" />
              <Picker.Item label="Every 5 Seconds" value="Every5Seconds" />
              <Picker.Item label="Every Minute" value="EveryMinute" />
            </Picker>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={addEventInstanceToExisting}>Add Instance</Button>
            <Button onPress={() => setIsAddInstanceModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <SettingsDialog
          visible={isSettingsModalVisible}
          onClose={handleCloseSettings}
          repeat={settings.repeat}
          setRepeat={(value) => setSettings((prev) => ({ ...prev, repeat: value }))}
          ringtone={settings.ringtone}
          setRingtone={(value) => setSettings((prev) => ({ ...prev, ringtone: value }))}
          snooze={settings.snooze}
          setSnooze={(value) => setSettings((prev) => ({ ...prev, snooze: value }))}
          onSave={updateAlarmSettings}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  repeatText: {
    fontSize: 14,
    color: '#007BFF',
  },
  alarmItem: {
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  alarmDetails: {
    flex: 1,
    marginLeft: 10,
  },
  alarmName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alarmDescription: {
    fontSize: 14,
    color: '#777',
  },
  alarmTime: {
    fontSize: 16,
  },
  instanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instanceDescription: {
    fontSize: 14,
    color: '#777',
  },
  modalContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  iconButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 50,
    height: 50,
  },
  alarmIcon: {
    width: 40,
    height: 40,
  },
  dateText: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  groupedInstance: {
    marginBottom: 5,
  },
  rightAction: {
    backgroundColor: 'red',
    justifyContent: 'center',
    flex: 1,
    alignItems: 'flex-end',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  picker: {
    width: '100%',
  },
  invalidInput: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Alarms;

