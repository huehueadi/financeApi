import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Link, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { api } from '../../services/api';

type FormData = {
  email: string;
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      // This is a placeholder - your backend might not have this endpoint
      await api.post('/users/forgot-password', { email: data.email });
      setMessage('Password reset instructions sent to your email');
      setIsSuccess(true);
      setVisible(true);
    } catch (err) {
      setMessage('Failed to send reset instructions. Please try again.');
      setIsSuccess(false);
      setVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              mode="outlined"
              error={!!errors.email}
              left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
            />
          )}
          name="email"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
          loading={isLoading}
          disabled={isLoading}
        >
          Send Reset Instructions
        </Button>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={isSuccess ? styles.successSnackbar : styles.errorSnackbar}
        action={{
          label: 'Close',
          onPress: () => setVisible(false),
        }}
      >
        {message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    color: '#0066CC',
    fontSize: 16,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  errorSnackbar: {
    backgroundColor: '#B00020',
  },
});