import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, FAB, Portal, Modal, TextInput, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgets } from '../../hooks/useBudgets';
import { formatCurrency } from '../../utils/formatters';
import { useForm, Controller } from 'react-hook-form';
import { ChartPie as PieChart, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { CATEGORIES } from '../../constants/categories';

type BudgetFormData = {
  category: string;
  limit: number; 
  period: string;
};

export default function BudgetsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  
  const { 
    budgets, 
    isLoading, 
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget
  } = useBudgets();
  
  React.useEffect(() => {
    if (budgets) {
      console.log('📥 Received budgets from backend:', budgets);
    }
  }, [budgets]); // This runs every time "budgets" updates
  

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>({
    defaultValues: {
      category: '',
      limit: 0, 
      period: 'monthly',
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const showModal = (budget?: any) => {
    if (budget) {
      setEditingBudget(budget);
      reset({
        category: budget.category,
        limit: budget.limit, 
        period: 'monthly', 
      });
    } else {
      setEditingBudget(null);
      reset({
        category: '',
        limit: 0, 
        period: 'monthly',
      });
    }
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setEditingBudget(null);
  };

  const showDeleteModal = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setDeleteModalVisible(false);
    setBudgetToDelete(null);
  };


  const onSubmit = async (data: BudgetFormData) => {
    try {
      const budgetData = {
        category: data.category,
        limit: data.limit, 
      };
  
      if (editingBudget) {
        await updateBudget(editingBudget._id, budgetData);
      } else {
        await createBudget(budgetData);
      }
  
      hideModal();
      refetch();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleDeleteBudget = async () => {
    if (budgetToDelete) {
      try {
        await deleteBudget(budgetToDelete);
        hideDeleteModal();
        refetch();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const calculateProgress = (spent: number, amount: number) => {
    return Math.min((spent / amount) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Budgets</Text>
      </View>

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
          {budgets && budgets.length > 0 ? (
            budgets.map((budget) => (
              <Card key={budget._id} style={styles.budgetCard}>
                <Card.Content>
                  <View style={styles.budgetCardHeader}>
                    <View style={styles.budgetTitleContainer}>
                      <PieChart size={20} color="#0066CC" />
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                    </View>
                    <View style={styles.budgetActions}>
                      <IconButton
                        icon={() => <Edit size={20} color="#666" />}
                        onPress={() => showModal(budget)}
                        size={20}
                      />
                      <IconButton
                        icon={() => <Trash2 size={20} color="#F44336" />}
                        onPress={() => showDeleteModal(budget._id)}
                        size={20}
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.budgetAmount}>
  {formatCurrency(budget.limit ?? budget.amount ?? 0)}
</Text>
                  <Text style={styles.budgetPeriod}>Monthly</Text> /

                  
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${calculateProgress(budget.spent, budget.amount)}%`,
                          backgroundColor: budget.spent > budget.amount ? '#F44336' : '#4CAF50'
                        }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.budgetStatsContainer}>
                    <Text style={styles.budgetSpent}>
                      Spent: {formatCurrency(budget.spent)}
                    </Text>
                    <Text style={styles.budgetRemaining}>
                      Remaining: {formatCurrency(Math.max(budget.amount - budget.spent, 0))}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No budgets created yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first budget</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </Text>
          
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
  rules={{ 
    required: 'Limit is required',
    pattern: {
      value: /^\d+(\.\d{1,2})?$/,
      message: 'Please enter a valid amount'
    }
  }}
  render={({ field: { onChange, value } }) => (
    <TextInput
      label="Limit" // ✅ Updated label
      value={value.toString()} // ✅ Ensure it's a string for TextInput
      onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ''))} // ✅ Allow only numbers
      style={styles.input}
      mode="outlined"
      keyboardType="numeric"
      error={!!errors.limit}
    />
  )}
  name="limit" // ✅ Use "limit" instead of "amount"
/>
{errors.limit && <Text style={styles.errorText}>{errors.limit.message}</Text>}

          
          <Controller
            control={control}
            rules={{ required: 'Period is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Period"
                value={value}
                onChangeText={onChange}
                style={styles.input}
                mode="outlined"
                error={!!errors.period}
              />
            )}
            name="period"
          />
          {errors.period && <Text style={styles.errorText}>{errors.period.message}</Text>}
          
          <View style={styles.modalActions}>
            <Button onPress={hideModal} style={styles.modalButton}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit(onSubmit)} 
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>

        <Modal
          visible={deleteModalVisible}
          onDismiss={hideDeleteModal}
          contentContainerStyle={styles.deleteModalContainer}
        >
          <Text style={styles.deleteModalTitle}>Delete Budget</Text>
          <Text style={styles.deleteModalText}>
            Are you sure you want to delete this budget? This action cannot be undone.
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
              onPress={handleDeleteBudget} 
              style={[styles.deleteModalButton, styles.deleteButton]}
              buttonColor="#F44336"
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => showModal()}
      />
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
  budgetCard: {
    marginBottom: 16,
    elevation: 2,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetCategory: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  budgetActions: {
    flexDirection: 'row',
  },
  budgetAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 4,
  },
  budgetPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
  },
  budgetRemaining: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066CC',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
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