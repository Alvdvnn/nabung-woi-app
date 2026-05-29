import { Component, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  // Optional fallback element. Default is a minimal "tap to retry" screen.
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.msg} numberOfLines={4}>
          {this.state.error.message || 'Unexpected error'}
        </Text>
        <Pressable style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#0a0a0a' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  msg: { fontSize: 14, color: '#cbd5e1', textAlign: 'center' },
  btn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#0d9488' },
  btnText: { color: '#ffffff', fontWeight: '700' },
});
