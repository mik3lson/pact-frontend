// src/services/api.js
import axios from 'axios';
import { db } from './mockDb';

// Set up custom Axios instance
const api = axios.create({
  baseURL: '/api',
});

// Helper for simulated latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom adapter to mock all HTTP endpoints and hook into mockDb
api.defaults.adapter = async (config) => {
  await delay(250); // 250ms simulated network speed
  
  const { url, method, data: rawData, params } = config;
  const data = rawData ? JSON.parse(rawData) : null;
  const currentUser = db.getCurrentUser();
  const userId = currentUser ? currentUser.id : null;

  // Clean URL by stripping baseURL
  const path = url.replace(/^\/api/, '');

  try {
    // ----------------------------------------------------
    // AUTHENTICATION & PROFILE
    // ----------------------------------------------------
    if (path === '/auth/login' && method === 'post') {
      const { email, password } = data;
      const users = db.getUsers();
      const user = users.find((u) => u.email === email && u.password === password);
      
      if (!user) {
        return Promise.reject({
          response: { status: 401, data: { message: 'Invalid email or password.' } }
        });
      }
      db.setCurrentUser(user);
      return { status: 200, data: { user, token: 'pact_session_token_' + user.id } };
    }

    if (path === '/auth/register' && method === 'post') {
      const { email, name, role, password } = data;
      const users = db.getUsers();
      
      if (users.some((u) => u.email === email)) {
        return Promise.reject({
          response: { status: 400, data: { message: 'A user with this email already exists.' } }
        });
      }

      const newUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email,
        password,
        name,
        username: name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 4),
        role, // 'freelancer' or 'client'
        title: role === 'freelancer' ? 'Freelance Specialist' : 'Business Owner',
        avatar: `https://images.unsplash.com/photo-${role === 'freelancer' ? '1472099645785-5658abf4ff4e' : '1580489944761-15a19d654956'}?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,
        bio: 'Welcome to your Pact account! You can edit your bio in Settings.',
        bankAccounts: [],
        settings: {
          notifications: { email: true, push: true, marketing: false },
          appearance: { theme: 'light', accent: '#6DB33F' },
          security: { twoFactor: false }
        }
      };

      // Seed initial wallet for registered users
      const wallet = db.getWallet();
      wallet[newUser.id] = { available: role === 'client' ? 50000 : 0, escrow: 0, withdrawable: role === 'client' ? 50000 : 0 };
      db.setWallet(wallet);

      users.push(newUser);
      db.setUsers(users);
      db.setCurrentUser(newUser);

      return { status: 201, data: { user: newUser, token: 'pact_session_token_' + newUser.id } };
    }

    if (path === '/auth/me' && method === 'get') {
      if (!currentUser) {
        return Promise.reject({ response: { status: 401, data: { message: 'Unauthorized' } } });
      }
      return { status: 200, data: { user: currentUser } };
    }

    if (path === '/auth/profile' && method === 'put') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const users = db.getUsers();
      const index = users.findIndex((u) => u.id === userId);
      
      const updatedUser = { ...users[index], ...data };
      users[index] = updatedUser;
      db.setUsers(users);
      db.setCurrentUser(updatedUser);

      return { status: 200, data: { user: updatedUser } };
    }

    if (path === '/auth/bank-accounts' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const users = db.getUsers();
      const index = users.findIndex((u) => u.id === userId);
      
      const newAccount = {
        id: 'bank_' + Math.random().toString(36).substr(2, 9),
        ...data,
        status: 'Verified' // Immediately verified for demo purposes
      };
      
      users[index].bankAccounts = users[index].bankAccounts || [];
      users[index].bankAccounts.push(newAccount);
      db.setUsers(users);
      db.setCurrentUser(users[index]);

      return { status: 200, data: { bankAccounts: users[index].bankAccounts } };
    }

    if (path.match(/\/auth\/bank-accounts\/[a-zA-Z0-9_]+/) && method === 'delete') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const id = path.split('/').pop();
      const users = db.getUsers();
      const index = users.findIndex((u) => u.id === userId);
      
      users[index].bankAccounts = (users[index].bankAccounts || []).filter(acct => acct.id !== id);
      db.setUsers(users);
      db.setCurrentUser(users[index]);
      
      return { status: 200, data: { bankAccounts: users[index].bankAccounts } };
    }

    // ----------------------------------------------------
    // CONTRACTS & ESCROW PORTAL
    // ----------------------------------------------------
    if (path === '/contracts' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const contracts = db.getContracts();
      const filtered = contracts.filter((c) => c.clientId === userId || c.freelancerId === userId);
      return { status: 200, data: { contracts: filtered } };
    }

    if (path === '/contracts' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const contracts = db.getContracts();
      
      const users = db.getUsers();
      let oppositeUser = null;

      const creatorRole = data.roleInContract || 'client'; // 'client' or 'freelancer'
      const counterpartyEmail = data.counterpartyEmail;

      oppositeUser = users.find(u => u.email === counterpartyEmail);
      if (!oppositeUser) {
        return Promise.reject({
          response: { status: 404, data: { message: `User with email "${counterpartyEmail}" not found.` } }
        });
      }

      const totalAmount = data.milestones.reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      const newContract = {
        id: 'con_' + Math.random().toString(36).substr(2, 9),
        title: data.title,
        description: data.description,
        clientId: creatorRole === 'client' ? currentUser.id : oppositeUser.id,
        clientName: creatorRole === 'client' ? currentUser.name : oppositeUser.name,
        clientAvatar: creatorRole === 'client' ? currentUser.avatar : oppositeUser.avatar,
        freelancerId: creatorRole === 'freelancer' ? currentUser.id : oppositeUser.id,
        freelancerName: creatorRole === 'freelancer' ? currentUser.name : oppositeUser.name,
        freelancerAvatar: creatorRole === 'freelancer' ? currentUser.avatar : oppositeUser.avatar,
        escrowAmount: totalAmount,
        status: creatorRole === 'client' ? 'Funded' : 'Pending', // Funded instantly if client creates it
        dueDate: data.dueDate,
        createdAt: new Date().toISOString(),
        milestones: data.milestones.map((m, index) => ({
          id: 'ms_' + Math.random().toString(36).substr(2, 9),
          title: m.title,
          amount: Number(m.amount),
          dueDate: m.dueDate,
          status: creatorRole === 'client' ? 'Pending' : 'Draft'
        })),
        messages: [
          {
            id: 'msg_' + Math.random().toString(36).substr(2, 9),
            senderId: currentUser.id,
            senderName: currentUser.name,
            content: `Contract created: "${data.title}" with budget $${totalAmount}.`,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Handle balance updates if client created it
      if (creatorRole === 'client') {
        const wallets = db.getWallet();
        if (wallets[currentUser.id].available < totalAmount) {
          return Promise.reject({
            response: { status: 400, data: { message: 'Insufficient funds in wallet available balance.' } }
          });
        }
        
        // Deduct from client available, lock in escrow
        wallets[currentUser.id].available -= totalAmount;
        wallets[currentUser.id].escrow += totalAmount;
        wallets[newContract.freelancerId].escrow += totalAmount;
        db.setWallet(wallets);

        // Add Deposit Transaction
        const transactions = db.getTransactions();
        transactions.push({
          id: 'tx_' + Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          type: 'Deposit',
          amount: totalAmount,
          status: 'Completed',
          timestamp: new Date().toISOString(),
          description: `Locked $${totalAmount} in escrow for contract: ${newContract.title}`,
          reference: newContract.id
        });
        db.setTransactions(transactions);

        // Send Notification to freelancer
        const notifications = db.getNotifications();
        notifications.push({
          id: 'nt_' + Math.random().toString(36).substr(2, 9),
          userId: newContract.freelancerId,
          title: 'New Contract Funded',
          message: `${currentUser.name} created and funded contract "${newContract.title}" ($${totalAmount}).`,
          type: 'success',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: `/contracts/${newContract.id}`
        });
        db.setNotifications(notifications);
      } else {
        // Freelancer initiated, sends proposal to client
        const notifications = db.getNotifications();
        notifications.push({
          id: 'nt_' + Math.random().toString(36).substr(2, 9),
          userId: newContract.clientId,
          title: 'New Contract Proposal',
          message: `${currentUser.name} proposed a contract "${newContract.title}" ($${totalAmount}). Please fund it to activate.`,
          type: 'info',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: `/contracts/${newContract.id}`
        });
        db.setNotifications(notifications);
      }

      contracts.push(newContract);
      db.setContracts(contracts);

      return { status: 201, data: { contract: newContract } };
    }

    if (path.match(/\/contracts\/[a-zA-Z0-9_]+$/) && method === 'get') {
      const id = path.split('/').pop();
      const contracts = db.getContracts();
      const contract = contracts.find(c => c.id === id);
      if (!contract) return Promise.reject({ response: { status: 404, data: { message: 'Contract not found' } } });
      return { status: 200, data: { contract } };
    }

    // Fund a contract proposal (initiated by client)
    if (path.match(/\/contracts\/[a-zA-Z0-9_]+\/fund$/) && method === 'post') {
      const id = path.split('/').slice(-2)[0];
      const contracts = db.getContracts();
      const contractIdx = contracts.findIndex(c => c.id === id);
      const contract = contracts[contractIdx];
      
      if (!contract) return Promise.reject({ response: { status: 404 } });
      if (currentUser.id !== contract.clientId) return Promise.reject({ response: { status: 403, data: { message: 'Only the paying client can fund this contract.' } } });

      const wallets = db.getWallet();
      const totalAmount = contract.escrowAmount;

      if (wallets[userId].available < totalAmount) {
        return Promise.reject({ response: { status: 400, data: { message: 'Insufficient funds. Deposit money in your settings/wallet first.' } } });
      }

      // Deduct client available, add to escrow balances
      wallets[userId].available -= totalAmount;
      wallets[userId].escrow += totalAmount;
      wallets[contract.freelancerId].escrow += totalAmount;
      db.setWallet(wallets);

      contract.status = 'Active';
      contract.milestones.forEach(m => m.status = 'Pending');
      contract.messages.push({
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        senderId: userId,
        senderName: currentUser.name,
        content: `Contract funded! Locked $${totalAmount} in escrow. Project is now active.`,
        timestamp: new Date().toISOString()
      });

      contracts[contractIdx] = contract;
      db.setContracts(contracts);

      // Create transaction
      const transactions = db.getTransactions();
      transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId,
        type: 'Deposit',
        amount: totalAmount,
        status: 'Completed',
        timestamp: new Date().toISOString(),
        description: `Funded contract: ${contract.title}`,
        reference: contract.id
      });
      db.setTransactions(transactions);

      // Notify freelancer
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: contract.freelancerId,
        title: 'Contract Funded & Active',
        message: `${currentUser.name} has funded the proposed contract "${contract.title}". You can now start working.`,
        type: 'success',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: `/contracts/${contract.id}`
      });
      db.setNotifications(notifications);

      return { status: 200, data: { contract } };
    }

    // Submit milestone (Freelancer)
    if (path.match(/\/contracts\/[a-zA-Z0-9_]+\/milestones\/[a-zA-Z0-9_]+\/submit$/) && method === 'post') {
      const parts = path.split('/');
      const contractId = parts[2];
      const milestoneId = parts[4];
      
      const contracts = db.getContracts();
      const contractIdx = contracts.findIndex(c => c.id === contractId);
      const contract = contracts[contractIdx];
      
      if (!contract) return Promise.reject({ response: { status: 404 } });
      const mIdx = contract.milestones.findIndex(m => m.id === milestoneId);
      
      contract.milestones[mIdx].status = 'Submitted';
      contract.status = 'Submitted'; // Contract overall status updates to Submitted
      
      contract.messages.push({
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        senderId: userId,
        senderName: currentUser.name,
        content: `Submitted milestone: "${contract.milestones[mIdx].title}" for approval.`,
        timestamp: new Date().toISOString()
      });

      contracts[contractIdx] = contract;
      db.setContracts(contracts);

      // Notify client
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: contract.clientId,
        title: 'Milestone Work Submitted',
        message: `${currentUser.name} submitted "${contract.milestones[mIdx].title}" for review.`,
        type: 'info',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: `/contracts/${contract.id}`
      });
      db.setNotifications(notifications);

      return { status: 200, data: { contract } };
    }

    // Approve & Release Milestone (Client)
    if (path.match(/\/contracts\/[a-zA-Z0-9_]+\/milestones\/[a-zA-Z0-9_]+\/approve$/) && method === 'post') {
      const parts = path.split('/');
      const contractId = parts[2];
      const milestoneId = parts[4];
      
      const contracts = db.getContracts();
      const contractIdx = contracts.findIndex(c => c.id === contractId);
      const contract = contracts[contractIdx];
      
      if (!contract) return Promise.reject({ response: { status: 404 } });
      const mIdx = contract.milestones.findIndex(m => m.id === milestoneId);
      const milestone = contract.milestones[mIdx];
      
      if (milestone.status === 'Approved' || milestone.status === 'Released') {
        return Promise.reject({ response: { status: 400, data: { message: 'Milestone already released.' } } });
      }

      const releaseAmount = milestone.amount;

      // Update milestone and contract status
      milestone.status = 'Released';
      
      // Determine new overall contract status
      const allReleased = contract.milestones.every(m => m.status === 'Released');
      contract.status = allReleased ? 'Released' : 'Active';

      contract.messages.push({
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        senderId: userId,
        senderName: currentUser.name,
        content: `Approved and released $${releaseAmount} for milestone: "${milestone.title}".`,
        timestamp: new Date().toISOString()
      });

      contracts[contractIdx] = contract;
      db.setContracts(contracts);

      // Wallet movements: Deduct from Escrow, Move to Freelancer withdrawable balance
      const wallets = db.getWallet();
      // Deduct from client and freelancer escrow pool
      wallets[contract.clientId].escrow -= releaseAmount;
      wallets[contract.freelancerId].escrow -= releaseAmount;
      // Add to freelancer available
      wallets[contract.freelancerId].available += releaseAmount;
      wallets[contract.freelancerId].withdrawable += releaseAmount;
      db.setWallet(wallets);

      // Add payout transaction to ledger for freelancer
      const transactions = db.getTransactions();
      transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: contract.freelancerId,
        type: 'Escrow Release',
        amount: releaseAmount,
        status: 'Completed',
        timestamp: new Date().toISOString(),
        description: `Escrow release: Milestone "${milestone.title}" from ${contract.clientName}`,
        reference: contract.id
      });
      db.setTransactions(transactions);

      // Notify freelancer
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: contract.freelancerId,
        title: 'Milestone Funds Released',
        message: `${currentUser.name} approved milestone "${milestone.title}" and released $${releaseAmount} to your wallet.`,
        type: 'success',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: `/contracts/${contract.id}`
      });
      db.setNotifications(notifications);

      return { status: 200, data: { contract } };
    }

    // Open Dispute (Client or Freelancer)
    if (path.match(/\/contracts\/[a-zA-Z0-9_]+\/dispute$/) && method === 'post') {
      const id = path.split('/').slice(-2)[0];
      const contracts = db.getContracts();
      const contractIdx = contracts.findIndex(c => c.id === id);
      const contract = contracts[contractIdx];
      
      if (!contract) return Promise.reject({ response: { status: 404 } });
      
      contract.status = 'Disputed';
      contract.messages.push({
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        senderId: userId,
        senderName: currentUser.name,
        content: `⚠️ OPENED A DISPUTE. Escrow funds for this contract are now locked pending arbitration. Support team notified.`,
        timestamp: new Date().toISOString()
      });

      contracts[contractIdx] = contract;
      db.setContracts(contracts);

      // Notify opposite party
      const oppositeId = userId === contract.clientId ? contract.freelancerId : contract.clientId;
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: oppositeId,
        title: '⚠️ Dispute Opened',
        message: `${currentUser.name} opened a dispute on contract "${contract.title}". Escrow funds are temporarily locked.`,
        type: 'danger',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: `/contracts/${contract.id}`
      });
      db.setNotifications(notifications);

      return { status: 200, data: { contract } };
    }

    // Send contract message
    if (path.match(/\/contracts\/[a-zA-Z0-9_]+\/messages$/) && method === 'post') {
      const id = path.split('/').slice(-2)[0];
      const contracts = db.getContracts();
      const contractIdx = contracts.findIndex(c => c.id === id);
      const contract = contracts[contractIdx];
      
      if (!contract) return Promise.reject({ response: { status: 404 } });
      
      const newMsg = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        senderId: userId,
        senderName: currentUser.name,
        content: data.content,
        timestamp: new Date().toISOString()
      };
      
      if (data.attachment) {
        newMsg.attachment = data.attachment; // Object with name, size, type
      }

      contract.messages.push(newMsg);
      contracts[contractIdx] = contract;
      db.setContracts(contracts);

      // Notify opposite party of new message
      const oppositeId = userId === contract.clientId ? contract.freelancerId : contract.clientId;
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: oppositeId,
        title: `Message from ${currentUser.name}`,
        message: data.content.length > 60 ? data.content.substring(0, 60) + '...' : data.content,
        type: 'info',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: `/contracts/${contract.id}`
      });
      db.setNotifications(notifications);

      return { status: 200, data: { messages: contract.messages } };
    }

    // ----------------------------------------------------
    // INVOICES
    // ----------------------------------------------------
    if (path === '/invoices' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const invoices = db.getInvoices();
      const filtered = invoices.filter(inv => inv.clientId === userId || inv.freelancerId === userId);
      return { status: 200, data: { invoices: filtered } };
    }

    if (path === '/invoices' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const invoices = db.getInvoices();
      const users = db.getUsers();

      // Resolve client from clientEmail address
      const oppositeUser = users.find(u => u.email === data.clientEmail);
      if (!oppositeUser) {
        return Promise.reject({
          response: { status: 404, data: { message: `User with email "${data.clientEmail}" not found.` } }
        });
      }

      // Calculations
      const subtotal = data.items.reduce((acc, curr) => acc + (Number(curr.rate) * Number(curr.quantity)), 0);
      const tax = Math.round(subtotal * 0.08); // 8% default VAT
      const discount = Number(data.discount || 0);
      const total = subtotal + tax - discount;

      const newInvoice = {
        id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
        title: data.title,
        clientId: oppositeUser.id,
        clientName: oppositeUser.name,
        clientEmail: oppositeUser.email,
        freelancerId: currentUser.id,
        freelancerName: currentUser.name,
        freelancerEmail: currentUser.email,
        items: data.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.quantity) * Number(item.rate)
        })),
        subtotal,
        tax,
        discount,
        total,
        status: data.status || 'Sent', // Draft or Sent
        dueDate: data.dueDate,
        createdAt: new Date().toISOString()
      };

      invoices.push(newInvoice);
      db.setInvoices(invoices);

      if (newInvoice.status === 'Sent') {
        const notifications = db.getNotifications();
        notifications.push({
          id: 'nt_' + Math.random().toString(36).substr(2, 9),
          userId: newInvoice.clientId,
          title: 'Invoice Received',
          message: `${newInvoice.freelancerName} sent you Invoice ${newInvoice.id} ($${newInvoice.total})`,
          type: 'info',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: '/invoices'
        });
        db.setNotifications(notifications);
      }

      return { status: 201, data: { invoice: newInvoice } };
    }

    // Pay invoice
    if (path.match(/\/invoices\/[a-zA-Z0-9_-]+\/pay$/) && method === 'post') {
      const id = path.split('/').slice(-2)[0];
      const invoices = db.getInvoices();
      const invoiceIdx = invoices.findIndex(i => i.id === id);
      const invoice = invoices[invoiceIdx];
      
      if (!invoice) return Promise.reject({ response: { status: 404 } });
      if (invoice.status === 'Paid') return Promise.reject({ response: { status: 400, data: { message: 'Invoice already paid.' } } });

      const wallets = db.getWallet();
      
      if (wallets[invoice.clientId].available < invoice.total) {
        return Promise.reject({ response: { status: 400, data: { message: 'Insufficient funds. Please add money in Wallet or profile.' } } });
      }

      // Money Transfer: Client available -> Freelancer available
      wallets[invoice.clientId].available -= invoice.total;
      wallets[invoice.clientId].withdrawable -= invoice.total;
      
      wallets[invoice.freelancerId].available += invoice.total;
      wallets[invoice.freelancerId].withdrawable += invoice.total;
      db.setWallet(wallets);

      invoice.status = 'Paid';
      invoices[invoiceIdx] = invoice;
      db.setInvoices(invoices);

      // Transactions
      const transactions = db.getTransactions();
      // Outflow for client
      transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: invoice.clientId,
        type: 'Outflow',
        amount: invoice.total,
        status: 'Completed',
        timestamp: new Date().toISOString(),
        description: `Paid Invoice ${invoice.id} to ${invoice.freelancerName}`,
        reference: invoice.id
      });
      // Inflow for freelancer
      transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId: invoice.freelancerId,
        type: 'Inflow',
        amount: invoice.total,
        status: 'Completed',
        timestamp: new Date().toISOString(),
        description: `Received payment for Invoice ${invoice.id} from ${invoice.clientName}`,
        reference: invoice.id
      });
      db.setTransactions(transactions);

      // Notify freelancer
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: invoice.freelancerId,
        title: 'Invoice Paid',
        message: `${currentUser.name} paid Invoice ${invoice.id} ($${invoice.total}).`,
        type: 'success',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: '/invoices'
      });
      db.setNotifications(notifications);

      return { status: 200, data: { invoice } };
    }

    // Cancel invoice
    if (path.match(/\/invoices\/[a-zA-Z0-9_-]+\/cancel$/) && method === 'post') {
      const id = path.split('/').slice(-2)[0];
      const invoices = db.getInvoices();
      const invoiceIdx = invoices.findIndex(i => i.id === id);
      const invoice = invoices[invoiceIdx];
      
      if (!invoice) return Promise.reject({ response: { status: 404 } });
      
      invoice.status = 'Cancelled';
      invoices[invoiceIdx] = invoice;
      db.setInvoices(invoices);
      
      return { status: 200, data: { invoice } };
    }

    // ----------------------------------------------------
    // WALLET & TRANSACTIONS
    // ----------------------------------------------------
    if (path === '/wallet' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const wallet = db.getWallet()[userId];
      return { status: 200, data: { wallet } };
    }

    // Deposit funds manually
    if (path === '/wallet/deposit' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const depositAmt = Number(data.amount);
      const wallets = db.getWallet();
      
      wallets[userId].available += depositAmt;
      wallets[userId].withdrawable += depositAmt;
      db.setWallet(wallets);

      // Add Deposit transaction
      const transactions = db.getTransactions();
      transactions.push({
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId,
        type: 'Deposit',
        amount: depositAmt,
        status: 'Completed',
        timestamp: new Date().toISOString(),
        description: `Funded Available Balance via bank transfer`,
        reference: data.bankId
      });
      db.setTransactions(transactions);

      return { status: 200, data: { wallet: wallets[userId] } };
    }

    // Withdraw funds
    if (path === '/wallet/withdraw' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const withdrawAmt = Number(data.amount);
      const wallets = db.getWallet();

      if (wallets[userId].withdrawable < withdrawAmt) {
        return Promise.reject({
          response: { status: 400, data: { message: 'Insufficient withdrawable balance.' } }
        });
      }

      // Deduct balance
      wallets[userId].available -= withdrawAmt;
      wallets[userId].withdrawable -= withdrawAmt;
      db.setWallet(wallets);

      // Log transaction
      const transactions = db.getTransactions();
      const newTx = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        userId,
        type: 'Withdrawal',
        amount: withdrawAmt,
        status: 'Completed',
        timestamp: new Date().toISOString(),
        description: `Withdrew to Bank Account (${data.bankName} - ${data.accountNumber})`,
        reference: data.bankAccountId
      };
      transactions.push(newTx);
      db.setTransactions(transactions);

      return { status: 200, data: { wallet: wallets[userId], transaction: newTx } };
    }

    if (path === '/wallet/transactions' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const transactions = db.getTransactions();
      const filtered = transactions.filter(tx => tx.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return { status: 200, data: { transactions: filtered } };
    }

    // Wallet Settlements
    if (path === '/wallet/settlements' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const transactions = db.getTransactions();
      const withdrawals = transactions.filter(tx => tx.userId === userId && tx.type === 'Withdrawal')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(tx => ({
          id: tx.id,
          date: tx.timestamp,
          reference: 'STL-' + tx.id.split('_').pop().toUpperCase(),
          destination: tx.description?.match(/\(([^)]+)\)/)?.[1] || 'Bank Account',
          amount: tx.amount,
          status: tx.status,
          processingTime: '1-2 business days'
        }));
      return { status: 200, data: { settlements: withdrawals } };
    }

    // Wallet Escrow Movements
    if (path === '/wallet/escrow-movements' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const contracts = db.getContracts();
      const userContracts = contracts.filter(c => c.clientId === userId || c.freelancerId === userId);
      const users = db.getUsers();
      const movements = userContracts.map(c => {
        const isClient = c.clientId === userId;
        const counterparty = users.find(u => u.id === (isClient ? c.freelancerId : c.clientId));
        return {
          id: 'em_' + c.id.split('_').pop(),
          escrowId: 'ESC-' + c.id.split('_').pop().toUpperCase(),
          project: c.title,
          counterparty: counterparty?.name || 'Unknown',
          amount: c.escrowAmount,
          type: c.status === 'Released' ? 'Released' : c.status === 'Disputed' ? 'Disputed' : 'Funded',
          date: c.createdAt,
          status: c.status === 'Released' ? 'Completed' : c.status === 'Disputed' ? 'Disputed' : 'Active'
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
      return { status: 200, data: { movements } };
    }

    // Wallet Payment Methods
    if (path === '/wallet/payment-methods' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const methods = [
        { id: 'pm_visa', type: 'visa', nickname: 'Personal Visa', last4: '4532', expMonth: 8, expYear: 2027, isDefault: true },
        { id: 'pm_mc', type: 'mastercard', nickname: 'Business Mastercard', last4: '8810', expMonth: 3, expYear: 2028, isDefault: false }
      ];
      return { status: 200, data: { methods } };
    }

    // Wallet Bank Account
    if (path === '/wallet/bank-account' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const account = {
        id: 'ba_' + Math.random().toString(36).substr(2, 9),
        bankName: 'Guaranty Trust Bank',
        accountName: currentUser.name,
        accountNumber: '0123456789',
        status: 'Verified'
      };
      return { status: 200, data: { account } };
    }

    // ----------------------------------------------------
    // NOTIFICATIONS
    // ----------------------------------------------------
    if (path === '/notifications' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const notifications = db.getNotifications();
      const filtered = notifications.filter(nt => nt.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return { status: 200, data: { notifications: filtered } };
    }

    if (path.match(/\/notifications\/[a-zA-Z0-9_]+\/read$/) && method === 'post') {
      const id = path.split('/').slice(-2)[0];
      const notifications = db.getNotifications();
      const ntIdx = notifications.findIndex(nt => nt.id === id);
      if (ntIdx !== -1) {
        notifications[ntIdx].read = true;
        db.setNotifications(notifications);
      }
      return { status: 200, data: { success: true } };
    }

    if (path === '/notifications/read-all' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const notifications = db.getNotifications();
      notifications.forEach(nt => {
        if (nt.userId === userId) nt.read = true;
      });
      db.setNotifications(notifications);
      return { status: 200, data: { success: true } };
    }

    // ----------------------------------------------------
    // DISPUTES
    // ----------------------------------------------------
    if (path === '/disputes' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const disputes = db.getDisputes();
      const filtered = disputes.filter(d => d.initiatorId === userId || d.respondentId === userId);
      return { status: 200, data: { disputes: filtered } };
    }

    if (path === '/disputes' && method === 'post') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const disputes = db.getDisputes();
      const users = db.getUsers();

      // Find the escrow/contract
      const contracts = db.getContracts();
      const contract = contracts.find(c => c.id === data.escrowId);
      
      if (!contract) {
        return Promise.reject({
          response: { status: 404, data: { message: 'Escrow not found.' } }
        });
      }

      // Determine respondent
      const respondentId = contract.clientId === userId ? contract.freelancerId : contract.clientId;
      const respondent = users.find(u => u.id === respondentId);

      const newDispute = {
        id: 'DSP-2026-' + String(Math.floor(100 + Math.random() * 900)).padStart(3, '0'),
        escrowId: contract.id,
        escrowTitle: contract.title,
        escrowAmount: contract.escrowAmount,
        invoiceNumber: data.invoiceNumber || null,
        initiatorId: userId,
        initiatorName: currentUser.name,
        initiatorRole: data.initiatorRole || currentUser.role,
        respondentId,
        respondentName: respondent?.name || 'Unknown',
        respondentRole: respondent?.role || 'unknown',
        reason: data.reason,
        reasonLabel: data.reasonLabel,
        explanation: data.explanation,
        desiredResolution: data.desiredResolution,
        evidence: data.evidence || [],
        status: 'Awaiting Counterparty Response',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          { event: 'Escrow Created', date: contract.createdAt },
          { event: 'Escrow Funded', date: contract.createdAt },
          { event: 'Work Started', date: contract.createdAt },
          { event: 'Work Delivered', date: contract.createdAt },
          { event: 'Dispute Opened', date: new Date().toISOString() },
          { event: 'Under Review', date: null },
          { event: 'Decision', date: null }
        ]
      };

      // Update contract status to disputed
      const contractIdx = contracts.findIndex(c => c.id === contract.id);
      contracts[contractIdx].status = 'Disputed';
      db.setContracts(contracts);

      disputes.push(newDispute);
      db.setDisputes(disputes);

      // Notify respondent
      const notifications = db.getNotifications();
      notifications.push({
        id: 'nt_' + Math.random().toString(36).substr(2, 9),
        userId: respondentId,
        title: '⚠️ Dispute Opened',
        message: `${currentUser.name} has opened a dispute on "${contract.title}". The escrow has been frozen pending review.`,
        type: 'danger',
        read: false,
        timestamp: new Date().toISOString(),
        actionUrl: `/disputes/${newDispute.id}`
      });
      db.setNotifications(notifications);

      return { status: 201, data: { dispute: newDispute } };
    }

    if (path.match(/\/disputes\/[a-zA-Z0-9_-]+$/) && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const id = path.split('/').pop();
      const disputes = db.getDisputes();
      const dispute = disputes.find(d => d.id === id);
      if (!dispute) {
        return Promise.reject({ response: { status: 404, data: { message: 'Dispute not found.' } } });
      }
      return { status: 200, data: { dispute } };
    }

    if (path === '/disputes/eligible-escrows' && method === 'get') {
      if (!currentUser) return Promise.reject({ response: { status: 401 } });
      const contracts = db.getContracts();
      const disputes = db.getDisputes();
      const disputedContractIds = disputes.map(d => d.escrowId);
      
      // Eligible: contracts where user is involved, not already disputed, and has some funding
      const eligible = contracts.filter(c => 
        (c.clientId === userId || c.freelancerId === userId) &&
        !disputedContractIds.includes(c.id) &&
        c.status !== 'Draft' &&
        c.status !== 'Released'
      );

      const users = db.getUsers();
      const escrows = eligible.map(c => {
        const counterpartyId = c.clientId === userId ? c.freelancerId : c.clientId;
        const counterparty = users.find(u => u.id === counterpartyId);
        return {
          id: c.id,
          title: c.title,
          escrowId: 'ESC-' + c.id.split('_').pop().toUpperCase(),
          counterpartyName: counterparty?.name || 'Unknown',
          counterpartyRole: c.clientId === userId ? 'Freelancer' : 'Client',
          amount: c.escrowAmount,
          status: c.status,
          createdAt: c.createdAt,
          dueDate: c.dueDate,
          invoiceNumber: c.invoiceNumber || null
        };
      });

      return { status: 200, data: { escrows } };
    }

    // Unmatched mock endpoint
    return Promise.reject({
      response: { status: 404, data: { message: `Mock API endpoint not found: ${method.toUpperCase()} ${path}` } }
    });

  } catch (error) {
    console.error('Mock Adapter Error:', error);
    return Promise.reject({
      response: { status: 500, data: { message: 'Internal server error in mock database.' } }
    });
  }
};

export default api;
