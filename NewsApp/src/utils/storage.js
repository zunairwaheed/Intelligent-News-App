import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@access_token',
  REFRESH_TOKEN: '@refresh_token',
  USER: '@user',
  LOCATION: '@saved_location',
};

export const saveTokens = async (access, refresh) => {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS_TOKEN, access],
    [KEYS.REFRESH_TOKEN, refresh],
  ]);
};

export const getAccessToken = () => AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => AsyncStorage.getItem(KEYS.REFRESH_TOKEN);

export const saveUser = (user) =>
  AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const saveLocation = (location) =>
  AsyncStorage.setItem(KEYS.LOCATION, JSON.stringify(location));

export const getSavedLocation = async () => {
  const raw = await AsyncStorage.getItem(KEYS.LOCATION);
  return raw ? JSON.parse(raw) : null;
};

export const clearAll = () => AsyncStorage.clear();
