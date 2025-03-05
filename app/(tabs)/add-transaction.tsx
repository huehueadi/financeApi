import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, RadioButton, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useTransactions } from '../../hooks/useTransactions';
import { useRouter } from 'expo-router';
import { CATEGORIES } from '../../constants/categories';

type TransactionFormData = {
  description: string;
  amount: string;
  category: string;
  date: string;
  notes: string;
};

export default function AddTransactionScreen() {
  const [transactionType, setTransactionType] = useState('expense');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const { createTransaction } = useTransactions();
  const router = useRouter();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsLoading(true);
      
      const transactionData = {
        description: data.description,
        amount: parseFloat(data.amount),
        type: transactionType,
        category: data.category,
        date: new Date(data.date).toISOString(),
        notes: data.notes,
      };

      await createTransaction(transactionData);
      
      setSnackbarMessage('Transaction added successfully');
      setSnackbarVisible(true);
      
      // Reset form
      reset();
      setTransactionType('expense');
      
      // Navigate back to transactions after a short delay
      setTimeout(() => {
        router.push('/transactions');
      }, 1500);
      
    } catch (error) {
      setSnackbarMessage('Failed to add transaction');
      setSnackbarVisible(true);
      console.error('Error adding transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Transaction</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.typeSelector}>
              <Text style={styles.typeLabel}>Transaction Type</Text>
              <View style={styles.radioGroup}>
                <View style={styles.radioButton}>
                  <RadioButton
                    value="expense"
                    status={transactionType === 'expense' ? 'checked' : 'unchecked'}
                    onPress={() => setTransactionType('expense')}
                    color="#0066CC"
                  />
                  <Text style={styles.radioLabel}>Expense</Text>
                </View>
                <View style={styles.radioButton}>
                  <RadioButton
                    value="income"
                    status={transactionType === 'income' ? 'checked' : 'unchecked'}
                    onPress={() => setTransactionType('income')}
                    color="#0066CC"
                  />
                  <Text style={styles.radioLabel}>Income</Text>
                </View>
              </View>
            </View>

            <Controller
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.description}
                />
              )}
              name="description"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

            <Controller
              control={control}
              rules={{ 
                required: 'Amount is required',
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: 'Please enter a valid amount'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Amount"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.amount}
                />
              )}
              name="amount"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}

            <Controller
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Category"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.category}
                />
              )}
              name="category"
            />
            {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

            <Controller
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Date (YYYY-MM-DD)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.date}
                />
              )}
              name="date"
            />
            {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Notes (Optional)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
              )}
              name="notes"
            />

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.button}
              loading={isLoading}
              disabled={isLoading}
            >
              Add Transaction
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Close',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    color: '#B00020',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
});