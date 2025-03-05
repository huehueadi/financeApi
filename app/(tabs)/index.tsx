import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useBudgets } from '../../hooks/useBudgets';
import { useTransactions } from '../../hooks/useTransactions';
import { useSpendingAlerts } from '../../hooks/useSpendingAlerts';
import { formatCurrency } from '../../utils/formatters';
import { CircleAlert as AlertCircle, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, CreditCard, ChartPie as PieChart } from 'lucide-react-native';
import { useRouter } from 'expo-router';


export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    budgets, 
    isLoading: budgetsLoading, 
    error: budgetsError,
    refetch: refetchBudgets
  } = useBudgets();
  
  const { 
    transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions,
    stats
  } = useTransactions();
  
  const { 
    alerts, 
    isLoading: alertsLoading, 
    error: alertsError,
    refetch: refetchAlerts
  } = useSpendingAlerts();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBudgets(),
      refetchTransactions(),
      refetchAlerts()
    ]);
    setRefreshing(false);
  };

  const isLoading = budgetsLoading || transactionsLoading || alertsLoading;
  const hasError = budgetsError || transactionsError || alertsError;

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
          </View>
        ) : hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong. Pull down to refresh.</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <Card style={[styles.summaryCard, styles.incomeCard]}>
                <Card.Content>
                  <View style={styles.cardIconContainer}>
                    <ArrowDownCircle size={24} color="#4CAF50" />
                  </View>
                  <Paragraph style={styles.cardLabel}>Income</Paragraph>
                  <Title style={styles.cardValue}>{formatCurrency(stats.totalIncome)}</Title>
                </Card.Content>
              </Card>
              
              <Card style={[styles.summaryCard, styles.expenseCard]}>
                <Card.Content>
                  <View style={styles.cardIconContainer}>
                    <ArrowUpCircle size={24} color="#F44336" />
                  </View>
                  <Paragraph style={styles.cardLabel}>Expenses</Paragraph>
                  <Title style={styles.cardValue}>{formatCurrency(stats.totalExpense)}</Title>
                </Card.Content>
              </Card>
            </View>

            {/* Alerts Section */}
            {alerts.length > 0 && (
  <View style={styles.alertsContainer}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Spending Alerts</Text>
    </View>
    {alerts.map((alert, index) => (
      <Card key={index} style={styles.alertCard}>
        <Card.Content style={styles.alertCardContent}>
          <AlertCircle size={24} color="#F44336" style={styles.alertIcon} />
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertDescription}>{alert.message}</Text>
          </View>
        </Card.Content>
      </Card>
    ))}
  </View>
)}

            {/* Budgets Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Budgets</Text>
                <TouchableOpacity onPress={() => router.push('/budgets')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {budgets && budgets.length > 0 ? (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
    {budgets.map((budget) => {
      const budgetAmount: number = budget.limit ?? 0; // Use 'limit' from API and ensure it's a number
      const budgetSpent: number = (budget.spent ?? 0); // Default to 0 if spent is undefined
      const progress: number = budgetAmount > 0 ? (budgetSpent / budgetAmount) * 100 : 0; // Avoid division by zero

      return (
        <Card key={budget._id} style={styles.budgetCard}>
          <Card.Content>
            <View style={styles.budgetCardHeader}>
              <PieChart size={20} color="#0066CC" />
              <Text style={styles.budgetCategory}>{budget.category}</Text>
            </View>
            <Title style={styles.budgetAmount}>{formatCurrency(budgetAmount)}</Title>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: budgetSpent > budgetAmount ? '#F44336' : '#4CAF50'
                  }
                ]} 
              />
            </View>
            <Text style={styles.budgetProgressText}>
              {formatCurrency(budgetSpent)} of {formatCurrency(budgetAmount)}
            </Text>
          </Card.Content>
        </Card>
      );
    })}
  </ScrollView>
) : (
  <Card style={styles.emptyStateCard}>
    <Card.Content style={styles.emptyStateContent}>
      <Text style={styles.emptyStateText}>No budgets created yet</Text>
      <Button 
        mode="contained" 
        onPress={() => router.push('/budgets')}
        style={styles.emptyStateButton}
      >
        Create Budget
      </Button>
    </Card.Content>
  </Card>
)}

            </View>

            {/* Recent Transactions */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={() => router.push('/transactions')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <Card key={transaction._id} style={styles.transactionCard}>
                    <Card.Content style={styles.transactionCardContent}>
                      <View style={styles.transactionIconContainer}>
                        <CreditCard size={20} color={transaction.type === 'income' ? '#4CAF50' : '#F44336'} />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle}>{transaction.description}</Text>
                        <Text style={styles.transactionCategory}>{transaction.category}</Text>
                      </View>
                      <View style={styles.transactionAmountContainer}>
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
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <Card style={styles.emptyStateCard}>
                  <Card.Content style={styles.emptyStateContent}>
                    <Text style={styles.emptyStateText}>No transactions recorded yet</Text>
                    <Button 
                      mode="contained" 
                      onPress={() => router.push('/add-transaction')}
                      style={styles.emptyStateButton}
                    >
                      Add Transaction
                    </Button>
                  </Card.Content>
                </Card>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333',
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    color: '#B00020',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  incomeCard: {
    backgroundColor: '#E8F5E9',
  },
  expenseCard: {
    backgroundColor: '#FFEBEE',
  },
  cardIconContainer: {
    marginBottom: 8,
  },
  cardLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  cardValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  alertsContainer: {
    marginBottom: 24,
  },
  alertCard: {
    marginBottom: 8,
    backgroundColor: '#FFF3E0',
    elevation: 2,
  },
  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333',
  },
  alertDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333',
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0066CC',
  },
  horizontalScroll: {
    marginHorizontal: -4,
  },
  budgetCard: {
    width: 200,
    marginHorizontal: 8,
    elevation: 2,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  budgetAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetProgressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
  },
  transactionCard: {
    marginBottom: 8,
    elevation: 2,
  },
  transactionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333',
  },
  transactionCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  transactionDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyStateCard: {
    padding: 8,
    elevation: 2,
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyStateButton: {
    marginTop: 8,
  },
});