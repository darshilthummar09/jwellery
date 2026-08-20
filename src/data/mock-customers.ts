export interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: string;
  joined: string;
  phone: string;
}

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'usr_customer_001', name: 'Priya Patel', email: 'customer1@dreamjewels.com', orders: 0, spent: 'Rs. 0', joined: 'Jan 2024', phone: '+91 98765 10001' },
];

export const blankCustomer: Customer = {
  id: '',
  name: '',
  email: '',
  orders: 0,
  spent: 'Rs. 0',
  joined: 'Today',
  phone: '',
};
