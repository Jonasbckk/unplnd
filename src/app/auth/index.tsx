import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button, Input, Logo, Screen, StatementTitle, Text } from '@/components/ui';
import { isStrongPassword, useAuthStore } from '@/features/auth/auth-store';
import { AppleSignInButton, isAppleSignInAvailable } from '@/lib/apple-auth';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

type Mode = 'signup' | 'signin';

/** Email + Apple (iOS) + Google auth (15_AUTH). */
export default function AuthScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const signUp = useAuthStore((s) => s.signUpWithEmail);
  const signIn = useAuthStore((s) => s.signInWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);

  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const onApple = async () => {
    if (appleLoading) return;
    setError(undefined);
    setInfo(undefined);
    setAppleLoading(true);
    const result = await signInWithApple();
    setAppleLoading(false);
    if (result.error) setError(result.error);
    // On success, the auth listener flips the root navigator to the app.
  };

  const onGoogle = async () => {
    setError(undefined);
    setInfo(undefined);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result.error) setError(result.error);
    // On success, the auth listener flips the root navigator to the app.
  };

  const submit = async () => {
    setError(undefined);
    setInfo(undefined);

    if (mode === 'signup' && !isStrongPassword(password)) {
      setError(tr('auth.passwordRule'));
      return;
    }

    setLoading(true);
    const result =
      mode === 'signup' ? await signUp(email.trim(), password, name.trim()) : await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    // On sign-up, most projects require email confirmation before a session exists.
    if (mode === 'signup' && !useAuthStore.getState().session) {
      setInfo(tr('auth.confirmEmail'));
      setMode('signin');
    }
    // On success with a session, the root navigator switches to the app automatically.
  };

  const toggleMode = () => {
    setMode(mode === 'signup' ? 'signin' : 'signup');
    setError(undefined);
    setInfo(undefined);
  };

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.base, flexGrow: 1 }}>
      <View style={{ alignItems: 'center', gap: t.spacing.sm, marginTop: t.spacing.xl, marginBottom: t.spacing.lg }}>
        <Logo size={56} />
        <StatementTitle
          text={mode === 'signup' ? tr('auth.createTitle') : tr('auth.welcomeBack')}
          style={{ textAlign: 'center' }}
        />
        <Text variant="body" color="textSecondary" center>
          {mode === 'signup' ? tr('auth.createSub') : tr('auth.signinSub')}
        </Text>
      </View>

      {mode === 'signup' ? (
        <Input label={tr('auth.firstName')} value={name} onChangeText={setName} autoCapitalize="words" placeholder="Max Mustermann" />
      ) : null}
      <Input
        label={tr('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <Input
        label={tr('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        error={error}
      />
      {info ? (
        <Text variant="small" color="success">
          {info}
        </Text>
      ) : null}

      <View style={{ marginTop: t.spacing.sm }}>
        <Button
          title={mode === 'signup' ? tr('auth.createAccount') : tr('auth.signIn')}
          loading={loading}
          disabled={!email || !password}
          onPress={submit}
        />
      </View>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginVertical: t.spacing.xs }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.colors.divider }} />
        <Text variant="small" color="textSecondary">
          {tr('auth.or')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: t.colors.divider }} />
      </View>

      {/* Apple — iOS only, Apple's official button, listed first (App Review guideline 4.8). */}
      {appleAvailable && (
        <View
          pointerEvents={appleLoading ? 'none' : 'auto'}
          style={{ opacity: appleLoading ? 0.5 : 1, justifyContent: 'center' }}
        >
          <AppleSignInButton
            onPress={() => void onApple()}
            dark={t.scheme === 'dark'}
            cornerRadius={t.radius.buttonSecondary}
            signUp={mode === 'signup'}
          />
          {appleLoading && <ActivityIndicator style={{ position: 'absolute', alignSelf: 'center' }} color={t.colors.primary} />}
        </View>
      )}

      {/* Google */}
      <Pressable
        onPress={onGoogle}
        disabled={googleLoading}
        accessibilityRole="button"
        style={{
          height: 52,
          borderRadius: t.radius.buttonSecondary,
          borderWidth: 1.5,
          borderColor: t.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.sm,
          opacity: googleLoading ? 0.5 : 1,
        }}
      >
        {googleLoading ? (
          <ActivityIndicator color={t.colors.primary} />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color={t.colors.textPrimary} />
            <Text variant="button" color="textPrimary">
              {tr('auth.continueWithGoogle')}
            </Text>
          </>
        )}
      </Pressable>

      <Text variant="small" color="textSecondary" center onPress={toggleMode} style={{ marginTop: t.spacing.sm }}>
        {mode === 'signup' ? tr('auth.haveAccount') : tr('auth.newHere')}
      </Text>
    </Screen>
  );
}
