import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Chip, ActivityIndicator, IconButton, Portal, Modal, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatters';
import { useForm, Controller } from 'react-hook-form';
import { CreditCard as Edit, Trash2, Filter } from 'lucide-react-native';

type TransactionFormData = {
  description: string;
  amount: string;
  category: string;
  date: string;
  notes: string;
  type: string;
};

export default function TransactionsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  const { 
    transactions, 
    isLoading, 
    error,
    refetch,
    updateTransaction,
    deleteTransaction
  } = useTransactions();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      description: '',
      amount: '',
      category: '',
      date: '',
      notes: '',
      type: 'expense',
    },
  });

  useEffect(() => {
    if (transactions) {
      const categories = [...new Set(transactions.map(t => t.category))];
      setUniqueCategories(categories);
    }
  }, [transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const showEditModal = (transaction: any) => {
    setEditingTransaction(transaction);
    reset({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: new Date(transaction.date).toISOString().split('T')[0],
      notes: transaction.notes || '',
      type: transaction.type,
    });
    setEditModalVisible(true);
  };

  const hideEditModal = () => {
    setEditModalVisible(false);
    setEditingTransaction(null);
  };

  const showDeleteModal = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setDeleteModalVisible(false);
    setTransactionToDelete(null);
  };

  const onSubmitEdit = async (data: TransactionFormData) => {
    if (!editingTransaction) return;
    
    try {
      const transactionData = {
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        date: new Date(data.date).toISOString(),
        notes: data.notes,
        type: data.type,
      };

      await updateTransaction(editingTransaction._id, transactionData);
      hideEditModal();
      refetch();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete);
        hideDeleteModal();
        refetch();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const filteredTransactions = selectedCategory
    ? transactions?.filter(t => t.category === selectedCategory)
    : transactions;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Chip
          mode="outlined"
          selected={selectedCategory === null}
          onPress={() => setSelectedCategory(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        {uniqueCategories.map((category) => (
          <Chip
            key={category}
            mode="outlined"
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.filterChip}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Pull down to refresh.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredTransactions && filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <Card key={transaction._id} style={styles.transactionCard}>
                <Card.Content>
                  <View style={styles.transactionHeader}>
                    <View>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    </View>
                    <View style={styles.transactionActions}>
                      <IconButton
                        icon={() => <Edit size={20} color="#666" />}
                        onPress={() => showEditModal(transaction)}
                        size={20}
                      />
                      <IconButton
                        icon={() => <Trash2 size={20} color="#F44336" />}
                        onPress={() => showDeleteModal(transaction._id)}
                        size={20}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text 
                      style={[
                        styles.transactionAmount, 
                        { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {transaction.notes && (
                    <Text style={styles.transactionNotes}>{transaction.notes}</Text>
                  )}
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
              {selectedCategory && (
                <Text style={styles.emptySubtext}>Try selecting a different category</Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit Transaction Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={hideEditModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Edit Transaction</Text>
          
          <Controller
            control={control}
            rules={{ required: 'Description is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Description"
                value={value}
                onChangeText={onChange}
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
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Amount"
                value={value}
                onChangeText={onChange}
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
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Category"
                value={value}
                onChangeText={onChange}
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
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Date (YYYY-MM-DD)"
                value={value}
                onChangeText={onChange}
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
            rules={{ required: 'Type is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeSelector}>
                <Text style={styles.typeLabel}>Transaction Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton, 
                      value === 'expense' && styles.typeButtonSelected
                    ]}
                    onPress={() => onChange('expense')}
                  >
                    <Text 
                      style={[
                        styles.typeButtonText,
                        value === 'expense' && styles.typeButtonTextSelected
                      ]}
                    >
                      Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.typeButton, 
                      value === 'income' && styles.typeButtonSelected
                    ]}
                    onPress={() => onChange('income')}
                  >
                    <Text 
                      style={[
                        styles.typeButtonText,
                        value === 'income' && styles.typeButtonTextSelected
                      ]}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            name="type"
          />
          
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Notes (Optional)"
                value={value}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            )}
            name="notes"
          />
          
          <View style={styles.modalActions}>
            <Button onPress={hideEditModal} style={styles.modalButton}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit(onSubmitEdit)} 
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          onDismiss={hideDeleteModal}
          contentContainerStyle={styles.deleteModalContainer}
        >
          <Text style={styles.deleteModalTitle}>Delete Transaction</Text>
          <Text style={styles.deleteModalText}>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </Text>
          
          <View style={styles.deleteModalActions}>
            <Button 
              onPress={hideDeleteModal} 
              style={styles.deleteModalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDeleteTransaction} 
              style={[styles.deleteModalButton, styles.deleteButton]}
              buttonColor="#F44336"
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    color: '#B00020',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionDescription: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  transactionCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionActions: {
    flexDirection: 'row',
  },
  transactionDetails: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  transactionNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 16,
    color: '#333',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  typeButtonText: {
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  deleteModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  deleteModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 16,
    color: '#333',
  },
  deleteModalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteModalButton: {
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
});