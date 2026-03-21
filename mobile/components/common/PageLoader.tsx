import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const PageLoader: React.FC = () => (
  <View style={styles.container}>
    <Image
      source={{ uri: 'https://raw.githubusercontent.com/shivendrra/acapella/0231e28f1500eb57ed6880c0fee61678cc131a7c/web/assets/svg/Loading.svg' }}
      style={styles.spinner}
      contentFit="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  spinner: {
    width: 96,
    height: 96,
  },
});

export default PageLoader;