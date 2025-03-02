import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SectionList, TouchableWithoutFeedback, Keyboard, ScrollView, Text } from 'react-native';
import { Button, Card, Paragraph, Title, TextInput } from 'react-native-paper';
import RNPickerSelect from 'react-native-picker-select';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import * as Notifications from 'expo-notifications';

export default function TimerScreen() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [label, setLabel] = useState('');
  const intervalRef = useRef(null);
  const fireworksRef = useRef(null);
  const confettiRef = useRef(null);
  const [timerHistory, setTimerHistory] = useState([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

  const startTimer = () => {
    setShowAnimation(false);
    const totalTime = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + (parseInt(seconds));
    if (totalTime > 0) {
      setTime(totalTime);
      setRunning(true);
      scheduleNotification(totalTime);
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            stopTimer();
            addTimerToHistory(0);
            triggerAnimations();
            sendNotification();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  };

  const stopTimer = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTime(0);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setLabel('');
  };

  const resetHistory = () => {
    setTimerHistory([]);
  };

  const addTimerToHistory = (timeValue) => {
    const timestamp = moment().format('M/D | h:mmA');
    const totalSeconds = timeValue === 0 ? (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + (parseInt(seconds)) : timeValue;
    const recordedHours = Math.floor(totalSeconds / 3600);
    const recordedMinutes = Math.floor((totalSeconds % 3600) / 60);
    const recordedSeconds = totalSeconds % 60;
    setTimerHistory(prevHistory => [
      ...prevHistory,
      { title: `${timestamp} : ${recordedHours}h ${recordedMinutes}m ${recordedSeconds}s`, data: [{ label }] }
    ]);
  };

  const triggerAnimations = () => {
    setShowAnimation(true);
    fireworksRef.current?.play();
    confettiRef.current?.play();
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Timer Complete",
        body: "Your timer has finished!",
      },
      trigger: null,
    });
  };

  const scheduleNotification = async (totalTime) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Timer Complete",
        body: "Your timer has finished!",
      },
      trigger: {
        seconds: totalTime,
      },
    });
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => ({ label: i.toString(), value: i }));
  const minutesSecondsArray = Array.from({ length: 60 }, (_, i) => ({ label: i.toString(), value: i }));

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Card style={styles.timerCard}>
            <Card.Content>
              <Paragraph style={styles.time}>{formatTime(time)}</Paragraph>
              <TextInput
                label="Label(Optional)"
                value={label}
                onChangeText={setLabel}
                style={styles.labelInput}
              />
              <View style={styles.pickerContainer}>
                <View style={styles.pickerItem}>
                  <RNPickerSelect
                    onValueChange={(value) => setHours(value)}
                    items={hoursArray}
                    value={hours}
                    placeholder={{ label: 'Hours', value: null }}
                    style={pickerSelectStyles}
                  />
                  <Paragraph>hours</Paragraph>
                </View>
                <View style={styles.pickerItem}>
                  <RNPickerSelect
                    onValueChange={(value) => setMinutes(value)}
                    items={minutesSecondsArray}
                    value={minutes}
                    placeholder={{ label: 'Minutes', value: null }}
                    style={pickerSelectStyles}
                  />
                  <Paragraph>minutes</Paragraph>
                </View>
                <View style={styles.pickerItem}>
                  <RNPickerSelect
                    onValueChange={(value) => setSeconds(value)}
                    items={minutesSecondsArray}
                    value={seconds}
                    placeholder={{ label: 'Seconds', value: null }}
                    style={pickerSelectStyles}
                  />
                  <Paragraph>seconds</Paragraph>
                </View>
              </View>
              <Button mode="contained" onPress={running ? stopTimer : startTimer} style={styles.button}>
                {running ? "Stop" : "Start"}
              </Button>
              <Button onPress={resetTimer} style={styles.button}>
                Reset
              </Button>
            </Card.Content>
          </Card>
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Title>Timer History</Title>
              <Icon name="recycle" size={24} color="gray" onPress={resetHistory} />
            </View>
            <SectionList
              sections={timerHistory}
              keyExtractor={(item, index) => item + index}
              renderItem={({ item }) => <Paragraph>{item.label}</Paragraph>}
              renderSectionHeader={({ section: { title } }) => <Title>{title}</Title>}
              ListEmptyComponent={<Text>No history available</Text>}
            />
          </View>
          {showAnimation && (
            <>
              <LottieView
                ref={fireworksRef}
                source={require('../images/timer.json')} // Update the path to your Lottie file
                autoPlay
                loop={false}
                onAnimationFinish={() => setShowAnimation(false)}
                style={styles.animation}
              />
              <LottieView
                ref={confettiRef}
                source={require('../images/fire2.json')} // Update the path to your Lottie file
                autoPlay
                loop={false}
                onAnimationFinish={() => setShowAnimation(false)}
                style={styles.animation}
              />
            </>
          )}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    width: 120,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    width: 120,
  },
});

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  timerCard: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  labelInput: {
    marginBottom: 20,
  },
  time: {
    fontSize: 25,
    padding: 50,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
  historyContainer: {
    marginTop: 20,
    width: '80%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  animation: {
    width: 300,
    height: 300,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
  },
});
