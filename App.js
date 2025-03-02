import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import Alarms from './screens/Alarms';
import Worldscreen from './screens/Worldscreen';
import StopWatch from './screens/Stopwatch';
import Timer from './screens/Timer';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AlarmsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlarmsScreen" component={Alarms} />
    </Stack.Navigator>
  );
}

function WorldClockStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorldClock" component={Worldscreen} />
    </Stack.Navigator>
  );
}

function StopWatchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StopWatchScreen" component={StopWatch} />
    </Stack.Navigator>
  );
}

function TimerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TimerScreen" component={Timer} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    const requestPermissions = async () => {
      await Permissions.askAsync(Permissions.NOTIFICATIONS);
    };
    requestPermissions();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;

              if (route.name === 'Alarms') {
                iconName = 'alarm';
              } else if (route.name === 'World Clock') {
                iconName = 'public';
              } else if (route.name === 'StopWatch') {
                iconName = 'timer';
              } else if (route.name === 'Timer') {
                iconName = 'hourglass-empty';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Alarms" component={AlarmsStack} />
          <Tab.Screen name="World Clock" component={WorldClockStack} />
          <Tab.Screen name="StopWatch" component={StopWatchStack} />
          <Tab.Screen name="Timer" component={TimerStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
