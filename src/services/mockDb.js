// src/services/mockDb.js

const KEY_USERS = 'pact_users';
const KEY_CONTRACTS = 'pact_contracts';
const KEY_INVOICES = 'pact_invoices';
const KEY_TRANSACTIONS = 'pact_transactions';
const KEY_NOTIFICATIONS = 'pact_notifications';
const KEY_WALLET = 'pact_wallet';
const KEY_CURRENT_USER = 'pact_current_user';

const INITIAL_USERS = [];

const INITIAL_CONTRACTS = [];

const INITIAL_INVOICES = [];

const INITIAL_TRANSACTIONS = [];

const INITIAL_NOTIFICATIONS = [];

const INITIAL_WALLET = {};

// Database Initialization
export function initDb() {
  if (!localStorage.getItem(KEY_USERS)) {
    localStorage.setItem(KEY_USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(KEY_CONTRACTS)) {
    localStorage.setItem(KEY_CONTRACTS, JSON.stringify(INITIAL_CONTRACTS));
  }
  if (!localStorage.getItem(KEY_INVOICES)) {
    localStorage.setItem(KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
  }
  if (!localStorage.getItem(KEY_TRANSACTIONS)) {
    localStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  }
  if (!localStorage.getItem(KEY_NOTIFICATIONS)) {
    localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(KEY_WALLET)) {
    localStorage.setItem(KEY_WALLET, JSON.stringify(INITIAL_WALLET));
  }
  if (!localStorage.getItem(KEY_CURRENT_USER)) {
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(null));
  }
}

// Getters and Setters
export function getData(key) {
  initDb();
  return JSON.parse(localStorage.getItem(key));
}

export function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const db = {
  getUsers: () => getData(KEY_USERS),
  setUsers: (users) => setData(KEY_USERS, users),
  
  getContracts: () => getData(KEY_CONTRACTS),
  setContracts: (contracts) => setData(KEY_CONTRACTS, contracts),
  
  getInvoices: () => getData(KEY_INVOICES),
  setInvoices: (invoices) => setData(KEY_INVOICES, invoices),
  
  getTransactions: () => getData(KEY_TRANSACTIONS),
  setTransactions: (transactions) => setData(KEY_TRANSACTIONS, transactions),
  
  getNotifications: () => getData(KEY_NOTIFICATIONS),
  setNotifications: (notifications) => setData(KEY_NOTIFICATIONS, notifications),
  
  getWallet: () => getData(KEY_WALLET),
  setWallet: (wallet) => setData(KEY_WALLET, wallet),
  
  getCurrentUser: () => getData(KEY_CURRENT_USER),
  setCurrentUser: (user) => setData(KEY_CURRENT_USER, user),
  
  clear: () => {
    localStorage.removeItem(KEY_USERS);
    localStorage.removeItem(KEY_CONTRACTS);
    localStorage.removeItem(KEY_INVOICES);
    localStorage.removeItem(KEY_TRANSACTIONS);
    localStorage.removeItem(KEY_NOTIFICATIONS);
    localStorage.removeItem(KEY_WALLET);
    localStorage.removeItem(KEY_CURRENT_USER);
    initDb();
  }
};
