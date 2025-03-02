import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import moment from 'moment';

export default function StopwatchScreen() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      const startTime = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const startStopwatch = () => {
    setRunning(true);
  };

  const stopStopwatch = () => {
    setRunning(false);
  };

  const resetStopwatch = () => {
    stopStopwatch();
    setTime(0);
    setLaps([]);
  };

  const addLap = () => {
    setLaps([...laps, time]);
  };

  const formatTime = (time) => {
    const duration = moment.duration(time);
    return moment.utc(duration.asMilliseconds()).format('HH:mm:ss.SS');
  };

  const getClockHandPositions = (time) => {
    const duration = moment.duration(time);
    const milliseconds = duration.milliseconds();
    const seconds = duration.seconds();
    const minutes = duration.minutes();
    const hours = duration.hours();

    const millisecondsAngle = (milliseconds / 1000) * 360;
    const secondsAngle = (seconds / 60) * 360;
    const minutesAngle = (minutes / 60) * 360;
    const hoursAngle = (hours / 12) * 360;

    return { millisecondsAngle, secondsAngle, minutesAngle, hoursAngle };
  };

  const { millisecondsAngle, secondsAngle, minutesAngle, hoursAngle } = getClockHandPositions(time);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={running ? stopStopwatch : startStopwatch}
            style={styles.startButton}
          >
            {running ? 'Stop' : 'Start'}
          </Button>
          <Button
            mode="contained"
            onPress={resetStopwatch}
            style={styles.resetButton}
          >
            Reset
          </Button>
        </View>
        <View style={styles.clockContainer}>
        <Svg height="240" width="240">
  <Circle cx="120" cy="120" r="110" stroke="black" strokeWidth="2.5" fill="none" />
  <Line
    x1="120"
    y1="120"
    x2="120"
    y2="20"
    stroke="red"
    strokeWidth="2.5"
    transform={`rotate(${millisecondsAngle}, 120, 120)`}
  />
  <Line
    x1="120"
    y1="120"
    x2="120"
    y2="10"
    stroke="blue"
    strokeWidth="2.5"
    transform={`rotate(${secondsAngle}, 120, 120)`}
  />
  <Line
    x1="120"
    y1="120"
    x2="120"
    y2="30"
    stroke="green"
    strokeWidth="2.5"
    transform={`rotate(${minutesAngle}, 120, 120)`}
  />
  <Line
    x1="120"
    y1="120"
    x2="120"
    y2="50"
    stroke="black"
    strokeWidth="2.5"
    transform={`rotate(${hoursAngle}, 120, 120)`}
  />
  {['0', '15', '30', '60'].map((number, index) => {
    const angle = (index * 90 - 90) * (Math.PI / 180);
    const x = 120 + 100 * Math.cos(angle);
    const y = 120 + 100 * Math.sin(angle);
    return <SvgText key={number} x={x} y={y} fontSize="12" textAnchor="middle">{number}</SvgText>;
  })}
</Svg>

          <Text style={styles.timeText}>{formatTime(time)}</Text>
        </View>
        {running && (
          <Button
            mode="contained"
            onPress={addLap}
            style={styles.lapButton}
          >
            Lap
          </Button>
        )}
        <FlatList
          data={laps}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <Text style={styles.lapText}>Lap {index + 1}: {formatTime(item)}</Text>
          )}
          ListEmptyComponent={<Text style={styles.noLapsText}>No laps recorded</Text>}
        />
      </View>
    </ScrollView>
  );
}

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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: 'green',
    marginRight: 20,
    padding: 20,
    borderRadius: 50,
  },
  resetButton: {
    backgroundColor: 'red',
    padding: 20,
    borderRadius: 50,
  },
  clockContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 24,
    marginTop: 10,
  },
  lapButton: {
    backgroundColor: 'blue',
    marginBottom: 20,
    padding: 10,
    borderRadius: 50,
  },
  lapText: {
    fontSize: 18,
  },
  noLapsText: {
    fontSize: 18,
    marginTop: 20,
    color: '#999',
  },
});
