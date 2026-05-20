import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { PinProvider, usePin } from '../context/PinContext';
import { CategoriesProvider } from '../context/CategoriesContext';
import { CalculatorProvider } from '../components/CalculatorProvider';
import PinLockScreen from '../components/PinLockScreen';
import { useTheme } from '../hooks/useTheme';
import { View } from 'react-native';

function ThemedStack() {
  const { colors, resolved } = useTheme();
  const pin = usePin();

  if (!pin.hydrated) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />
      {pin.locked && pin.enabled ? (
        <PinLockScreen onUnlock={pin.unlock} onRecovered={() => { pin.refresh(); pin.unlock(); }} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <ToastProvider>
              <CalculatorProvider>
                <PinProvider>
                  <CategoriesProvider>
                    <ThemedStack />
                  </CategoriesProvider>
                </PinProvider>
              </CalculatorProvider>
            </ToastProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
